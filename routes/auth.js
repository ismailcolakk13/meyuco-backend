const express = require("express");
const router = express.Router();
const db = require("../db");

// Kullanıcı kayıt (register) endpointi
router.post("/register", async (req, res) => {
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
router.post("/giris", async (req, res) => {
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[DEBUG] /api/giris veritabanı hatası:", err);
    return res.status(500).json({ message: "Veritabanı hatası" });
  }
});

// Şifremi unuttum endpointi: e-posta + yeni şifre ile kullanıcı şifresini günceller
router.put("/sifremi-unuttum", async (req, res) => {
  console.log("[DEBUG] PUT /api/sifremi-unuttum çağrıldı, body:", req.body);
  const { email, yeni_sifre } = req.body;

  if (!email || !yeni_sifre) {
    return res.status(400).json({ message: "E-posta ve yeni şifre gereklidir" });
  }

  const sql = `UPDATE users SET password = $1 WHERE email = $2`;
  try {
    const result = await db.query(sql, [yeni_sifre, email]);
    if (result.rowCount === 0) {
      console.log("[DEBUG] /api/sifremi-unuttum: kullanıcı bulunamadı:", email);
      return res.status(404).json({ message: "Bu e-posta ile eşleşen kullanıcı bulunamadı" });
    }

    console.log("[DEBUG] /api/sifremi-unuttum: şifre güncellendi");
    res.json({ message: "Şifre başarıyla güncellendi" });
  } catch (err) {
    console.error("[DEBUG] /api/sifremi-unuttum güncelleme hatası:", err);
    return res.status(500).json({ message: "Şifre güncellenemedi" });
  }
});

module.exports = router;

