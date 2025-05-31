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
    // Ekleme başarılıysa tüm etkinlikleri döndür
    db.query("SELECT * FROM etkinlikler", (err2, results) => {
      if (err2) {
        return res.status(500).json({ message: "Etkinlikler alınamadı" });
      }
      res.status(201).json({ message: "Etkinlik başarıyla eklendi", etkinlikler: results });
    });
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
    // Silme başarılıysa tüm etkinlikleri döndür
    db.query("SELECT * FROM etkinlikler", (err2, results) => {
      if (err2) {
        return res.status(500).json({ message: "Etkinlikler alınamadı" });
      }
      res.json({ message: "Etkinlik başarıyla silindi", etkinlikler: results });
    });
  });
});

// Etkinlik düzenleme endpointi
app.put("/api/etkinlik-duzenle/:id", (req, res) => {
  const { id } = req.params;
  const { ad, img, aciklama, tarih, mekan, fiyat, kategori } = req.body;
  const sql = `UPDATE etkinlikler SET ad = ?, img = ?, aciklama = ?, tarih = ?, mekan = ?, fiyat = ?, kategori = ? WHERE id = ?`;
  db.query(sql, [ad, img, aciklama, tarih, mekan, fiyat, kategori, id], (err, result) => {
    if (err) {
      console.error("Etkinlik güncellenirken hata:", err);
      return res.status(500).json({ message: "Etkinlik güncellenemedi" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    // Güncelleme başarılıysa tüm etkinlikleri döndür
    db.query("SELECT * FROM etkinlikler", (err2, results) => {
      if (err2) {
        return res.status(500).json({ message: "Etkinlikler alınamadı" });
      }
      res.json({ message: "Etkinlik başarıyla güncellendi", etkinlikler: results });
    });
  });
});

// Kullanıcı kayıt (register) endpointi
app.post("/api/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, ad ve şifre zorunludur" });
  }
  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Veritabanı hatası" });
    if (results.length > 0) {
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı" });
    }
    const insertSql = "INSERT INTO users (email, password, name) VALUES (?, ?, ?)";
    db.query(insertSql, [email, password, name], (err2, result) => {
      if (err2) return res.status(500).json({ message: "Kayıt başarısız" });
      res.status(201).json({
        message: "Kayıt başarılı",
        user: { id: result.insertId, email, name }
      });
    });
  });
});

// Kullanıcı giriş endpointi
app.post("/api/giris", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email ve şifre gereklidir" });
  }
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Veritabanı hatası" });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }
    const user = results[0];
    if (user.password !== password) {
      return res.status(401).json({ message: "Şifre hatalı" });
    }
    res.json({ message: "Giriş başarılı", user: { id: user.id, email: user.email, name: user.name } });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
