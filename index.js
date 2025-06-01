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

// Kullanıcının satın aldığı biletleri ekleyen endpoint
app.post("/api/bilet-al", (req, res) => {
  console.log("[DEBUG] POST /api/bilet-al çağrıldı, body:", req.body);
  const { user_id, etkinlik_id, adet, koltuk } = req.body;
  if (!user_id || !etkinlik_id || !adet) {
    return res.status(400).json({ message: "user_id, etkinlik_id ve adet zorunludur" });
  }
  const sql = `INSERT INTO biletler (user_id, etkinlik_id, adet, koltuk) VALUES (?, ?, ?, ?)`;
  db.query(sql, [user_id, etkinlik_id, adet, koltuk || null], (err, result) => {
    if (err) {
      console.error("[DEBUG] /api/bilet-al eklenirken hata:", err);
      return res.status(500).json({ message: "Bilet eklenemedi" });
    }
    console.log("[DEBUG] /api/bilet-al ekleme sonucu:", result);
    res.status(201).json({ message: "Bilet başarıyla eklendi", bilet_id: result.insertId });
  });
});

// Bir kullanıcının satın aldığı tüm etkinlik biletleri ve etkinlik detayları
app.get("/api/kullanici-biletleri/:user_id", (req, res) => {
  const { user_id } = req.params;
  console.log("[DEBUG] GET /api/kullanici-biletleri/:user_id çağrıldı, user_id:", user_id);
  const sql = `SELECT biletler.id AS bilet_id, etkinlikler.*, biletler.adet, biletler.satin_alma_tarihi, biletler.koltuk FROM biletler JOIN etkinlikler ON biletler.etkinlik_id = etkinlikler.id WHERE biletler.user_id = ?`;
  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/kullanici-biletleri alınırken hata:", err);
      return res.status(500).json({ message: "Biletler alınamadı" });
    }
    res.json({ biletler: results });
  });
});

// Bir etkinliği satın alan tüm kullanıcılar
app.get("/api/etkinlik-biletleri/:etkinlik_id", (req, res) => {
  const { etkinlik_id } = req.params;
  console.log("[DEBUG] GET /api/etkinlik-biletleri/:etkinlik_id çağrıldı, etkinlik_id:", etkinlik_id);
  const sql = `SELECT users.id AS user_id, users.name, users.email, biletler.adet, biletler.satin_alma_tarihi, biletler.koltuk FROM biletler JOIN users ON biletler.user_id = users.id WHERE biletler.etkinlik_id = ?`;
  db.query(sql, [etkinlik_id], (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/etkinlik-biletleri alınırken hata:", err);
      return res.status(500).json({ message: "Kullanıcılar alınamadı" });
    }
    res.json({ kullanicilar: results });
  });
});

// Tüm biletler, kullanıcı ve etkinlik bilgileriyle
app.get("/api/tum-biletler", (req, res) => {
  console.log("[DEBUG] GET /api/tum-biletler çağrıldı");
  const sql = `SELECT biletler.*, users.name AS kullanici_adi, users.email, etkinlikler.ad AS etkinlik_adi, etkinlikler.tarih FROM biletler JOIN users ON biletler.user_id = users.id JOIN etkinlikler ON biletler.etkinlik_id = etkinlikler.id`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/tum-biletler alınırken hata:", err);
      return res.status(500).json({ message: "Biletler alınamadı" });
    }
    res.json({ biletler: results });
  });
});

// Biletler tablosunu oluşturan endpoint (koltuk bilgisi eklendi)
app.get("/api/create-biletler-table", (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS biletler (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      etkinlik_id INT NOT NULL,
      adet INT DEFAULT 1,
      koltuk VARCHAR(50) DEFAULT NULL,
      satin_alma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("[DEBUG] /api/create-biletler-table tablo oluşturulurken hata:", err);
      return res.status(500).send("Biletler tablosu oluşturulamadı");
    }
    res.send("Biletler tablosu başarıyla oluşturuldu!");
  });
});

// Belirli bir biletin tüm detaylarını döndüren endpoint
app.get("/api/bilet-detay/:bilet_id", (req, res) => {
  const { bilet_id } = req.params;
  console.log("[DEBUG] GET /api/bilet-detay/:bilet_id çağrıldı, bilet_id:", bilet_id);
  const sql = `
    SELECT biletler.*, users.name AS kullanici_adi, users.email, etkinlikler.ad AS etkinlik_adi, etkinlikler.tarih, etkinlikler.mekan, etkinlikler.fiyat, etkinlikler.kategori
    FROM biletler
    JOIN users ON biletler.user_id = users.id
    JOIN etkinlikler ON biletler.etkinlik_id = etkinlikler.id
    WHERE biletler.id = ?
  `;
  db.query(sql, [bilet_id], (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/bilet-detay alınırken hata:", err);
      return res.status(500).json({ message: "Bilet detayı alınamadı" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Bilet bulunamadı" });
    }
    res.json({ bilet: results[0] });
  });
});

// Bir etkinlikteki dolu koltukları döndüren endpoint
app.get("/api/etkinlik-dolu-koltuklar/:etkinlik_id", (req, res) => {
  const { etkinlik_id } = req.params;
  console.log("[DEBUG] GET /api/etkinlik-dolu-koltuklar/:etkinlik_id çağrıldı, etkinlik_id:", etkinlik_id);
  const sql = `SELECT koltuk FROM biletler WHERE etkinlik_id = ? AND koltuk IS NOT NULL`;
  db.query(sql, [etkinlik_id], (err, results) => {
    if (err) {
      console.error("[DEBUG] /api/etkinlik-dolu-koltuklar alınırken hata:", err);
      return res.status(500).json({ message: "Dolu koltuklar alınamadı" });
    }
    const dolu_koltuklar = results.map(r => r.koltuk).filter(Boolean);
    res.json({ dolu_koltuklar });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
