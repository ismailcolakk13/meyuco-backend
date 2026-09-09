const express = require("express");
const router = express.Router();
const db = require("../db");

// Kullanıcının satın aldığı biletleri ekleyen endpoint
router.post("/bilet-al", async (req, res) => {
  console.log("[DEBUG] POST /api/bilet-al çağrıldı, body:", req.body);
  const { user_id, etkinlik_id, adet, koltuk } = req.body;
  if (!user_id || !etkinlik_id || !adet) {
    return res
      .status(400)
      .json({ message: "user_id, etkinlik_id ve adet zorunludur" });
  }
  // Koltuk dizisini JSON olarak kaydet
  let koltukStr = null;
  if (koltuk) {
    if (Array.isArray(koltuk)) {
      koltukStr = JSON.stringify(koltuk);
    } else if (typeof koltuk === "string") {
      // Tek koltuk string geldiyse yine diziye çevirip kaydet
      koltukStr = JSON.stringify([koltuk]);
    }
  }
  const sql = `INSERT INTO biletler (user_id, etkinlik_id, adet, koltuk) VALUES ($1, $2, $3, $4) RETURNING id`;
  try {
    const result = await db.query(sql, [user_id, etkinlik_id, adet, koltukStr]);
    console.log("[DEBUG] /api/bilet-al ekleme sonucu:", result.rows[0]);
    res.status(201).json({
      message: "Bilet başarıyla eklendi",
      bilet_id: result.rows[0].id,
    });
  } catch (err) {
    console.error("[DEBUG] /api/bilet-al eklenirken hata:", err);
    return res.status(500).json({ message: "Bilet eklenemedi" });
  }
});

// Bir kullanıcının satın aldığı tüm etkinlik biletleri ve etkinlik detayları
router.get("/kullanici-biletleri/:user_id", async (req, res) => {
  const { user_id } = req.params;
  console.log(
    "[DEBUG] GET /api/kullanici-biletleri/:user_id çağrıldı, user_id:",
    user_id
  );
  const sql = `SELECT biletler.id AS bilet_id, etkinlikler.*, biletler.adet, biletler.satin_alma_tarihi, biletler.koltuk FROM biletler JOIN etkinlikler ON biletler.etkinlik_id = etkinlikler.id WHERE biletler.user_id = $1`;
  try {
    const result = await db.query(sql, [user_id]);
    res.json({ biletler: result.rows });
  } catch (err) {
    console.error("[DEBUG] /api/kullanici-biletleri alınırken hata:", err);
    return res.status(500).json({ message: "Biletler alınamadı" });
  }
});

// Bir etkinliği satın alan tüm kullanıcılar
router.get("/etkinlik-biletleri/:etkinlik_id", async (req, res) => {
  const { etkinlik_id } = req.params;
  console.log(
    "[DEBUG] GET /api/etkinlik-biletleri/:etkinlik_id çağrıldı, etkinlik_id:",
    etkinlik_id
  );
  const sql = `SELECT users.id AS user_id, users.name, users.email, biletler.adet, biletler.satin_alma_tarihi, biletler.koltuk FROM biletler JOIN users ON biletler.user_id = users.id WHERE biletler.etkinlik_id = $1`;
  try {
    const result = await db.query(sql, [etkinlik_id]);
    res.json({ kullanicilar: result.rows });
  } catch (err) {
    console.error("[DEBUG] /api/etkinlik-biletleri alınırken hata:", err);
    return res.status(500).json({ message: "Kullanıcılar alınamadı" });
  }
});

// Tüm biletler, kullanıcı ve etkinlik bilgileriyle
router.get("/tum-biletler", async (req, res) => {
  console.log("[DEBUG] GET /api/tum-biletler çağrıldı");
  const sql = `SELECT biletler.*, users.name AS kullanici_adi, users.email, etkinlikler.ad AS etkinlik_adi, etkinlikler.tarih FROM biletler JOIN users ON biletler.user_id = users.id JOIN etkinlikler ON biletler.etkinlik_id = etkinlikler.id`;
  try {
    const result = await db.query(sql);
    res.json({ biletler: result.rows });
  } catch (err) {
    console.error("[DEBUG] /api/tum-biletler alınırken hata:", err);
    return res.status(500).json({ message: "Biletler alınamadı" });
  }
});

// Biletler tablosunu oluşturan endpoint (koltuk bilgisi eklendi)
router.get("/create-biletler-table", async (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS biletler (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      etkinlik_id INT NOT NULL,
      adet INT DEFAULT 1,
      koltuk VARCHAR(255) DEFAULT NULL,
      satin_alma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id) ON DELETE CASCADE
    );
  `;
  try {
    await db.query(sql);
    res.send("Biletler tablosu başarıyla oluşturuldu!");
  } catch (err) {
    console.error(
      "[DEBUG] /api/create-biletler-table tablo oluşturulurken hata:",
      err
    );
    return res.status(500).send("Biletler tablosu oluşturulamadı");
  }
});

// Belirli bir biletin tüm detaylarını döndüren endpoint
router.get("/bilet-detay/:bilet_id", async (req, res) => {
  const { bilet_id } = req.params;
  console.log(
    "[DEBUG] GET /api/bilet-detay/:bilet_id çağrıldı, bilet_id:",
    bilet_id
  );
  const sql = `
    SELECT biletler.*, users.name AS kullanici_adi, users.email, etkinlikler.ad AS etkinlik_adi, etkinlikler.tarih, etkinlikler.mekan, etkinlikler.fiyat, etkinlikler.kategori
    FROM biletler
    JOIN users ON biletler.user_id = users.id
    JOIN etkinlikler ON biletler.etkinlik_id = etkinlikler.id
    WHERE biletler.id = $1
  `;
  try {
    const result = await db.query(sql, [bilet_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bilet bulunamadı" });
    }
    res.json({ bilet: result.rows[0] });
  } catch (err) {
    console.error("[DEBUG] /api/bilet-detay alınırken hata:", err);
    return res.status(500).json({ message: "Bilet detayı alınamadı" });
  }
});

// Bir etkinlikteki dolu koltukları döndüren endpoint
router.get("/etkinlik-dolu-koltuklar/:etkinlik_id", async (req, res) => {
  const { etkinlik_id } = req.params;
  console.log(
    "[DEBUG] GET /api/etkinlik-dolu-koltuklar/:etkinlik_id çağrıldı, etkinlik_id:",
    etkinlik_id
  );
  const sql = `SELECT koltuk FROM biletler WHERE etkinlik_id = $1 AND koltuk IS NOT NULL`;
  try {
    const result = await db.query(sql, [etkinlik_id]);
    // Her kayıttaki koltuk JSON dizisini açıp birleştir
    let dolu_koltuklar = [];
    result.rows.forEach((r) => {
      if (r.koltuk) {
        try {
          const arr = JSON.parse(r.koltuk);
          if (Array.isArray(arr)) dolu_koltuklar.push(...arr);
        } catch (e) {
          /* ignore parse error */
        }
      }
    });
    res.json({ dolu_koltuklar });
  } catch (err) {
    console.error(
      "[DEBUG] /api/etkinlik-dolu-koltuklar alınırken hata:",
      err
    );
    return res.status(500).json({ message: "Dolu koltuklar alınamadı" });
  }
});

module.exports = router;

