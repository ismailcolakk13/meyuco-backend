const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  db.query('SELECT NOW() as t', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Veritabanı hatası');
    }
    res.send(`Veritabanı bağlantısı başarılı! Sunucu zamanı: ${results[0].t}`);
  });
});

// Etkinlikler tablosundaki tüm verileri döndüren endpoint
app.get("/api/etkinlikler", (req, res) => {
  db.query("SELECT * FROM etkinlikler", (err, results) => {
    if (err) {
      console.error("Etkinlikler alınırken hata oluştu:", err);
      return res.status(500).json({ message: "Veritabanı hatası" });
    }
    return res.json(results);
  });
});

// Frontend'den etkinlik eklemek için endpoint
app.post("/api/etkinlik-ekle", (req, res) => {
  const { ad, img, aciklama, tarih, mekan, fiyat, kategori } = req.body;
  const sql = `INSERT INTO etkinlikler (ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [ad, img, aciklama, tarih, mekan, fiyat, kategori], (err, result) => {
    if (err) {
      console.error("Etkinlik eklenirken hata:", err);
      return res.status(500).json({ message: "Etkinlik eklenemedi" });
    }
    res.status(201).json({ message: "Etkinlik başarıyla eklendi", id: result.insertId });
  });
});

// Etkinlik silme endpointi
app.delete("/api/etkinlik-sil/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM etkinlikler WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Etkinlik silinirken hata:", err);
      return res.status(500).json({ message: "Etkinlik silinemedi" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    res.json({ message: "Etkinlik başarıyla silindi" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
