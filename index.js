const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("[DEBUG] GET / endpoint çağrıldı");
  db.query('SELECT NOW() as t', (err, results) => {
    if (err) {
      console.error("[DEBUG] / veritabanı hatası:", err);
      return res.status(500).send('Veritabanı hatası');
    }
    console.log("[DEBUG] / veritabanı bağlantısı başarılı, sonuç:", results);
    res.send(`Veritabanı bağlantısı başarılı! Sunucu zamanı: ${results[0].t}`);
  });
});

// Etkinlikler tablosundaki tüm verileri döndüren endpoint
app.get("/api/etkinlikler", (req, res) => {
  console.log("[DEBUG] GET /api/etkinlikler çağrıldı");
  db.query("SELECT * FROM etkinlikler", (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/etkinlikler alınırken hata:", err);
      return res.status(500).json({ message: "Veritabanı hatası" });
    }
    console.log("[DEBUG] /api/etkinlikler sonuç:", results);
    return res.json(results);
  });
});

// Frontend'den etkinlik eklemek için endpoint
app.post("/api/etkinlik-ekle", (req, res) => {
  console.log("[DEBUG] POST /api/etkinlik-ekle çağrıldı, body:", req.body);
  const { ad, img, aciklama, tarih, mekan, fiyat, kategori } = req.body;
  const sql = `INSERT INTO etkinlikler (ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [ad, img, aciklama, tarih, mekan, fiyat, kategori], (err, result) => {
    if (err) {
      console.error("[DEBUG] /api/etkinlik-ekle eklenirken hata:", err);
      return res.status(500).json({ message: "Etkinlik eklenemedi" });
    }
    console.log("[DEBUG] /api/etkinlik-ekle ekleme sonucu:", result);
    // Ekleme başarılıysa tüm etkinlikleri döndür
    db.query("SELECT * FROM etkinlikler", (err2, results) => {
      if (err2) {
        console.error("[DEBUG] /api/etkinlik-ekle sonrası etkinlikler alınamadı:", err2);
        return res.status(500).json({ message: "Etkinlikler alınamadı" });
      }
      console.log("[DEBUG] /api/etkinlik-ekle sonrası etkinlikler:", results);
      res.status(201).json({ message: "Etkinlik başarıyla eklendi", etkinlikler: results });
    });
  });
});

// Etkinlik silme endpointi
app.delete("/api/etkinlik-sil/:id", (req, res) => {
  console.log("[DEBUG] DELETE /api/etkinlik-sil/:id çağrıldı, id:", req.params.id);
  const { id } = req.params;
  const sql = `DELETE FROM etkinlikler WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("[DEBUG] /api/etkinlik-sil silinirken hata:", err);
      return res.status(500).json({ message: "Etkinlik silinemedi" });
    }
    console.log("[DEBUG] /api/etkinlik-sil silme sonucu:", result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    // Silme başarılıysa tüm etkinlikleri döndür
    db.query("SELECT * FROM etkinlikler", (err2, results) => {
      if (err2) {
        console.error("[DEBUG] /api/etkinlik-sil sonrası etkinlikler alınamadı:", err2);
        return res.status(500).json({ message: "Etkinlikler alınamadı" });
      }
      console.log("[DEBUG] /api/etkinlik-sil sonrası etkinlikler:", results);
      res.json({ message: "Etkinlik başarıyla silindi", etkinlikler: results });
    });
  });
});

// Etkinlik düzenleme endpointi
app.put("/api/etkinlik-duzenle/:id", (req, res) => {
  console.log("[DEBUG] PUT /api/etkinlik-duzenle/:id çağrıldı, id:", req.params.id, "body:", req.body);
  const { id } = req.params;
  const { ad, img, aciklama, tarih, mekan, fiyat, kategori } = req.body;
  const sql = `UPDATE etkinlikler SET ad = ?, img = ?, aciklama = ?, tarih = ?, mekan = ?, fiyat = ?, kategori = ? WHERE id = ?`;
  db.query(sql, [ad, img, aciklama, tarih, mekan, fiyat, kategori, id], (err, result) => {
    if (err) {
      console.error("[DEBUG] /api/etkinlik-duzenle güncellenirken hata:", err);
      return res.status(500).json({ message: "Etkinlik güncellenemedi" });
    }
    console.log("[DEBUG] /api/etkinlik-duzenle güncelleme sonucu:", result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    // Güncelleme başarılıysa tüm etkinlikleri döndür
    db.query("SELECT * FROM etkinlikler", (err2, results) => {
      if (err2) {
        console.error("[DEBUG] /api/etkinlik-duzenle sonrası etkinlikler alınamadı:", err2);
        return res.status(500).json({ message: "Etkinlikler alınamadı" });
      }
      console.log("[DEBUG] /api/etkinlik-duzenle sonrası etkinlikler:", results);
      res.json({ message: "Etkinlik başarıyla güncellendi", etkinlikler: results });
    });
  });
});

// Kullanıcı kayıt (register) endpointi
app.post("/api/register", (req, res) => {
  console.log("[DEBUG] POST /api/register çağrıldı, body:", req.body);
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, ad ve şifre zorunludur" });
  }
  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/register veritabanı hatası:", err);
      return res.status(500).json({ message: "Veritabanı hatası" });
    }
    if (results.length > 0) {
      console.log("[DEBUG] /api/register email zaten kayıtlı:", email);
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı" });
    }
    const insertSql = "INSERT INTO users (email, password, name) VALUES (?, ?, ?)";
    db.query(insertSql, [email, password, name], (err2, result) => {
      if (err2) {
        console.error("[DEBUG] /api/register kayıt başarısız:", err2);
        return res.status(500).json({ message: "Kayıt başarısız" });
      }
      console.log("[DEBUG] /api/register kayıt başarılı, userId:", result.insertId);
      res.status(201).json({
        message: "Kayıt başarılı",
        user: { id: result.insertId, email, name }
      });
    });
  });
});

// Kullanıcı giriş endpointi
app.post("/api/giris", (req, res) => {
  console.log("[DEBUG] POST /api/giris çağrıldı, body:", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email ve şifre gereklidir" });
  }
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/giris veritabanı hatası:", err);
      return res.status(500).json({ message: "Veritabanı hatası" });
    }
    if (results.length === 0) {
      console.log("[DEBUG] /api/giris kullanıcı bulunamadı:", email);
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }
    const user = results[0];
    if (user.password !== password) {
      console.log("[DEBUG] /api/giris şifre hatalı:", email);
      return res.status(401).json({ message: "Şifre hatalı" });
    }
    console.log("[DEBUG] /api/giris giriş başarılı, user:", user);
    res.json({ message: "Giriş başarılı", user: { id: user.id, email: user.email, name: user.name } });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
