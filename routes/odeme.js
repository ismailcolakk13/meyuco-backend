const express = require("express");
const router = express.Router();
const db = require("../db");
const iyzicoService = require("../services/iyzicoService");

// Ödeme durum & konfigürasyon bilgisi
router.get("/odeme/durum", (req, res) => {
  res.json({
    saglayici: "iyzico",
    aktif: true,
    canliIstemci: iyzicoService.isConfigured(),
    mod: iyzicoService.isConfigured() ? "sandbox_veya_canli" : "gelistirme_simulasyonu",
  });
});

// Doğrudan kartla ödeme yapma ve bilet oluşturma endpoint'i
router.post("/odeme/kartla-ode", async (req, res) => {
  console.log("[DEBUG] POST /api/odeme/kartla-ode çağrıldı, body:", {
    ...req.body,
    kart: req.body.kart
      ? {
          ...req.body.kart,
          kartNo: req.body.kart.kartNo ? `**** ${req.body.kart.kartNo.slice(-4)}` : undefined,
          cvc: "***",
        }
      : undefined,
  });

  const { user_id, etkinlik_id, adet, koltuk, kart } = req.body;

  // 1. Girdi Doğrulama
  if (!user_id || !etkinlik_id || !adet || !kart) {
    return res.status(400).json({
      success: false,
      message: "user_id, etkinlik_id, adet ve kart bilgileri zorunludur.",
    });
  }

  if (!kart.isim || !kart.kartNo || !kart.sonKullanma || !kart.cvc) {
    return res.status(400).json({
      success: false,
      message: "Lütfen kart üzerindeki tüm alanları eksiksiz doldurunuz.",
    });
  }

  try {
    // 2. Kullanıcı kontrolü
    const userRes = await db.query("SELECT id, name, email FROM users WHERE id = $1", [user_id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });
    }
    const user = userRes.rows[0];

    // 3. Etkinlik kontrolü
    const etkinlikRes = await db.query("SELECT * FROM etkinlikler WHERE id = $1", [etkinlik_id]);
    if (etkinlikRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Etkinlik bulunamadı." });
    }
    const etkinlik = etkinlikRes.rows[0];

    // 4. Koltuk Çakışması (Race condition & Çifte rezervasyon koruması)
    let koltukStr = null;
    let requestedSeats = [];
    if (koltuk) {
      if (Array.isArray(koltuk)) {
        requestedSeats = koltuk;
        koltukStr = JSON.stringify(koltuk);
      } else if (typeof koltuk === "string") {
        requestedSeats = [koltuk];
        koltukStr = JSON.stringify([koltuk]);
      }
    }

    if (requestedSeats.length > 0) {
      const existingTickets = await db.query(
        "SELECT koltuk FROM biletler WHERE etkinlik_id = $1 AND koltuk IS NOT NULL",
        [etkinlik_id]
      );
      const takenSeats = new Set();
      existingTickets.rows.forEach((r) => {
        try {
          const parsed = JSON.parse(r.koltuk);
          if (Array.isArray(parsed)) {
            parsed.forEach((s) => takenSeats.add(String(s).trim()));
          } else if (parsed) {
            takenSeats.add(String(parsed).trim());
          }
        } catch (e) {
          if (typeof r.koltuk === "string") {
            r.koltuk.split(",").forEach((s) => takenSeats.add(s.trim()));
          }
        }
      });

      const conflicts = requestedSeats.filter((s) => takenSeats.has(String(s).trim()));
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Seçtiğiniz koltuk(lar) (${conflicts.join(", ")}) az önce başka bir kullanıcı tarafından satın alındı. Lütfen başka bir koltuk seçiniz.`,
        });
      }
    }

    // 5. Backend üzerinde güvenli tutar hesabı (Client manipulasyonunu engeller)
    const unitPrice = parseFloat(etkinlik.fiyat) || 0;
    const ticketCount = parseInt(adet, 10);
    const totalAmount = parseFloat((unitPrice * ticketCount).toFixed(2));

    // 6. Beklemede durumunda ödeme kaydı oluştur
    const odemeInsert = await db.query(
      `INSERT INTO odemeler (user_id, etkinlik_id, tutar, adet, koltuk, odeme_saglayici, durum)
       VALUES ($1, $2, $3, $4, $5, 'iyzico', 'beklemede')
       RETURNING id`,
      [user_id, etkinlik_id, totalAmount, ticketCount, koltukStr]
    );
    const odemeRecordId = odemeInsert.rows[0].id;

    // 7. iyzico Ödeme Çağrısı
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const iyzicoResult = await iyzicoService.createDirectPayment({
      user,
      etkinlik,
      tutar: totalAmount,
      kart,
      clientIp,
    });

    console.log("[DEBUG] iyzico yanıt sonucu:", {
      status: iyzicoResult.status,
      paymentId: iyzicoResult.paymentId,
      errorMessage: iyzicoResult.errorMessage,
    });

    // 8. Ödeme Başarılı İse
    if (iyzicoResult.status === "success") {
      const paymentId = iyzicoResult.paymentId || `PAY_${Date.now()}`;

      // Ödeme tablosunu güncelle
      await db.query(
        "UPDATE odemeler SET durum = 'basarili', odeme_id = $1 WHERE id = $2",
        [paymentId, odemeRecordId]
      );

      // Biletler tablosuna kaydet
      const biletInsert = await db.query(
        `INSERT INTO biletler (user_id, etkinlik_id, adet, koltuk, odeme_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, satin_alma_tarihi`,
        [user_id, etkinlik_id, ticketCount, koltukStr, odemeRecordId]
      );

      return res.status(200).json({
        success: true,
        message: "Ödemeniz başarıyla tamamlandı ve biletiniz oluşturuldu!",
        bilet_id: biletInsert.rows[0].id,
        odeme_id: odemeRecordId,
        provider_payment_id: paymentId,
        tutar: totalAmount,
        satin_alma_tarihi: biletInsert.rows[0].satin_alma_tarihi,
        is_mock: !!iyzicoResult.isMock,
      });
    }

    // 9. Ödeme Başarısız İse
    const errorMsg = iyzicoResult.errorMessage || "Ödeme bankanız tarafından onaylanmadı.";
    await db.query(
      "UPDATE odemeler SET durum = 'basarisiz', hata_mesaji = $1 WHERE id = $2",
      [errorMsg, odemeRecordId]
    );

    return res.status(400).json({
      success: false,
      message: errorMsg,
      errorCode: iyzicoResult.errorCode,
    });
  } catch (err) {
    console.error("[ERROR] Ödeme sırasında beklenmedik hata:", err);
    return res.status(500).json({
      success: false,
      message: "Ödeme işlemi sırasında bir sunucu hatası oluştu. Lütfen tekrar deneyiniz.",
    });
  }
});

// Bir kullanıcının tüm ödeme geçmişi
router.get("/odeme/gecmis/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const sql = `
      SELECT o.*, e.ad AS etkinlik_adi, e.tarih AS etkinlik_tarihi, e.mekan, e.img AS etkinlik_img
      FROM odemeler o
      JOIN etkinlikler e ON o.etkinlik_id = e.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(sql, [user_id]);
    res.json({ odemeler: result.rows });
  } catch (err) {
    console.error("[ERROR] Ödeme geçmişi alınırken hata:", err);
    res.status(500).json({ message: "Ödeme geçmişi alınamadı." });
  }
});

module.exports = router;

