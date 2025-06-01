const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// Bağlantı havuzu (pool) ile otomatik yeniden bağlantı ve daha güvenli kullanım
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL bağlantısı başarısız:", err);
    return;
  }
  console.log("MySQL bağlantısı başarılı.");
  connection.release();
});

module.exports = pool;
