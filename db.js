const { Pool, types } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// NUMERIC / DECIMAL verilerini float olarak ayrıştır
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

// Bağlantı havuzu (pool)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL bağlantısı başarısız:", err.message);
    return;
  }
  console.log("PostgreSQL bağlantısı başarılı.");
  release();
});

module.exports = pool;

