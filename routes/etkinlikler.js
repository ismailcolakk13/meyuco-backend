const express = require("express");
const router = express.Router();
const db = require("../db");

// Etkinlikler tablosundaki tüm verileri döndüren endpoint
router.get("/etkinlikler", async (req, res) => {
  console.log("[DEBUG] GET /api/etkinlikler çağrıldı");
  try {
    const result = await db.query("SELECT * FROM etkinlikler ORDER BY id ASC");
    console.log("[DEBUG] /api/etkinlikler sonuç:", result.rows);
    return res.json(result.rows);
  } catch (err) {
    console.error("[DEBUG] /api/etkinlikler alınırken hata:", err);
    return res.status(500).json({ message: "Veritabanı hatası" });
  }
});

// Frontend'den etkinlik eklemek için endpoint
router.post("/etkinlik-ekle", async (req, res) => {
  console.log("[DEBUG] POST /api/etkinlik-ekle çağrıldı, body:", req.body);
  const { ad, img, aciklama, tarih, mekan, fiyat, kategori } = req.body;
  const sql = `INSERT INTO etkinlikler (ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
  try {
    const result = await db.query(sql, [ad, img, aciklama, tarih, mekan, fiyat, kategori]);
    console.log("[DEBUG] /api/etkinlik-ekle ekleme sonucu:", result.rows[0]);
    // Ekleme başarılıysa tüm etkinlikleri döndür
    const allEvents = await db.query("SELECT * FROM etkinlikler ORDER BY id ASC");
    res.status(201).json({
      message: "Etkinlik başarıyla eklendi",
      etkinlikler: allEvents.rows,
    });
  } catch (err) {
    console.error("[DEBUG] /api/etkinlik-ekle eklenirken hata:", err);
    return res.status(500).json({ message: "Etkinlik eklenemedi" });
  }
});

// Etkinlik silme endpointi
router.delete("/etkinlik-sil/:id", async (req, res) => {
  console.log("[DEBUG] DELETE /api/etkinlik-sil/:id çağrıldı, id:", req.params.id);
  const { id } = req.params;
  const sql = `DELETE FROM etkinlikler WHERE id = $1`;
  try {
    const result = await db.query(sql, [id]);
    console.log("[DEBUG] /api/etkinlik-sil silme sonucu:", result.rowCount);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    // Silme başarılıysa tüm etkinlikleri döndür
    const allEvents = await db.query("SELECT * FROM etkinlikler ORDER BY id ASC");
    res.json({ message: "Etkinlik başarıyla silindi", etkinlikler: allEvents.rows });
  } catch (err) {
    console.error("[DEBUG] /api/etkinlik-sil silinirken hata:", err);
    return res.status(500).json({ message: "Etkinlik silinemedi" });
  }
});

// Etkinlik düzenleme endpointi
router.put("/etkinlik-duzenle/:id", async (req, res) => {
  console.log(
    "[DEBUG] PUT /api/etkinlik-duzenle/:id çağrıldı, id:",
    req.params.id,
    "body:",
    req.body
  );
  const { id } = req.params;
  const { ad, img, aciklama, tarih, mekan, fiyat, kategori } = req.body;
  const sql = `UPDATE etkinlikler SET ad = $1, img = $2, aciklama = $3, tarih = $4, mekan = $5, fiyat = $6, kategori = $7 WHERE id = $8`;
  try {
    const result = await db.query(sql, [ad, img, aciklama, tarih, mekan, fiyat, kategori, id]);
    console.log("[DEBUG] /api/etkinlik-duzenle güncelleme sonucu:", result.rowCount);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    // Güncelleme başarılıysa tüm etkinlikleri döndür
    const allEvents = await db.query("SELECT * FROM etkinlikler ORDER BY id ASC");
    res.json({
      message: "Etkinlik başarıyla güncellendi",
      etkinlikler: allEvents.rows,
    });
  } catch (err) {
    console.error("[DEBUG] /api/etkinlik-duzenle güncellenirken hata:", err);
    return res.status(500).json({ message: "Etkinlik güncellenemedi" });
  }
});

module.exports = router;

