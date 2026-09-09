const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { updateMissingImages } = require("./scrapers/imageScraper");

const authRoutes = require("./routes/auth");
const etkinlikRoutes = require("./routes/etkinlikler");
const biletRoutes = require("./routes/biletler");

const app = express();
app.use(cors());
app.use(express.json());

// Sağlık kontrolü
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

// Modüler rotalar
app.use("/api", authRoutes);
app.use("/api", etkinlikRoutes);
app.use("/api", biletRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
  updateMissingImages();
});
