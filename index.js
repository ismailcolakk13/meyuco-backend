const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { updateMissingImages } = require('./imageScraper.js');
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  console.log("[DEBUG] GET / endpoint çağrıldı");
  try {
    const result = await db.query("SELECT NOW() as t");
    console.log("[DEBUG] / veritabanı bağlantısı başarılı, sonuç:", result.rows);
    res.send(`Veritabanı bağlantısı başarılı! Sunucu zamanı: ${result.rows[0].t}`);
  } catch (err) {
    console.error("[DEBUG] / veritabanı hatası:", err);
    res.status(500).send("Veritabanı hatası");
  }
});

// Etkinlikler tablosundaki tüm verileri döndüren endpoint
app.get("/api/etkinlikler", async (req, res) => {
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
app.post("/api/etkinlik-ekle", async (req, res) => {
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
app.delete("/api/etkinlik-sil/:id", async (req, res) => {
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
app.put("/api/etkinlik-duzenle/:id", async (req, res) => {
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

// Kullanıcı kayıt (register) endpointi
app.post("/api/register", async (req, res) => {
  console.log("[DEBUG] POST /api/register çağrıldı, body:", req.body);
  const { email, password, name, role = "user" } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, ad ve şifre zorunludur" });
  }
  try {
    const checkSql = "SELECT * FROM users WHERE email = $1";
    const checkResult = await db.query(checkSql, [email]);
    if (checkResult.rows.length > 0) {
      console.log("[DEBUG] /api/register email zaten kayıtlı:", email);
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı" });
    }
    const insertSql =
      "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role";
    const insertResult = await db.query(insertSql, [email, password, name, role || "user"]);
    const newUser = insertResult.rows[0];
    console.log("[DEBUG] /api/register kayıt başarılı, userId:", newUser.id);
    res.status(201).json({
      message: "Kayıt başarılı",
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("[DEBUG] /api/register kayıt başarısız:", err);
    return res.status(500).json({ message: "Kayıt başarısız" });
  }
});

// Kullanıcı giriş endpointi
app.post("/api/giris", async (req, res) => {
  console.log("[DEBUG] POST /api/giris çağrıldı, body:", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email ve şifre gereklidir" });
  }
  try {
    const sql = `SELECT * FROM users WHERE email = $1`;
    const result = await db.query(sql, [email]);
    if (result.rows.length === 0) {
      console.log("[DEBUG] /api/giris kullanıcı bulunamadı:", email);
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }
    const user = result.rows[0];
    if (user.password !== password) {
      console.log("[DEBUG] /api/giris şifre hatalı:", email);
      return res.status(401).json({ message: "Şifre hatalı" });
    }
    console.log("[DEBUG] /api/giris giriş başarılı, user:", user);
    res.json({
      message: "Giriş başarılı",
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error("[DEBUG] /api/giris veritabanı hatası:", err);
    return res.status(500).json({ message: "Veritabanı hatası" });
  }
});

// Kullanıcının satın aldığı biletleri ekleyen endpoint
app.post("/api/bilet-al", async (req, res) => {
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
app.get("/api/kullanici-biletleri/:user_id", async (req, res) => {
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
app.get("/api/etkinlik-biletleri/:etkinlik_id", async (req, res) => {
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
app.get("/api/tum-biletler", async (req, res) => {
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
app.get("/api/create-biletler-table", async (req, res) => {
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
app.get("/api/bilet-detay/:bilet_id", async (req, res) => {
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
app.get("/api/etkinlik-dolu-koltuklar/:etkinlik_id", async (req, res) => {
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

const PORT = process.env.PORT || 5001;

// Şifremi unuttum endpointi: e-posta + yeni şifre ile kullanıcı şifresini günceller
app.put("/api/sifremi-unuttum", async (req, res) => {
  console.log("[DEBUG] PUT /api/sifremi-unuttum çağrıldı, body:", req.body);
  const { email, yeni_sifre } = req.body;

  if (!email || !yeni_sifre) {
    return res
      .status(400)
      .json({ message: "E-posta ve yeni şifre gereklidir" });
  }

  const sql = `UPDATE users SET password = $1 WHERE email = $2`;
  try {
    const result = await db.query(sql, [yeni_sifre, email]);
    if (result.rowCount === 0) {
      console.log("[DEBUG] /api/sifremi-unuttum: kullanıcı bulunamadı:", email);
      return res
        .status(404)
        .json({ message: "Bu e-posta ile eşleşen kullanıcı bulunamadı" });
    }

    console.log("[DEBUG] /api/sifremi-unuttum: şifre güncellendi");
    res.json({ message: "Şifre başarıyla güncellendi" });
  } catch (err) {
    console.error("[DEBUG] /api/sifremi-unuttum güncelleme hatası:", err);
    return res.status(500).json({ message: "Şifre güncellenemedi" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
  updateMissingImages();
});

