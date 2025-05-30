const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST, // sadece host kısmı
  port: process.env.DB_PORT,                     // Railway'de verilen özel port
  user: process.env.DB_USER, // Railway'de verilen kullanıcı adı
  password: process.env.DB_PASSWORD, // Railway'de verilen şifre
  database: process.env.DB_NAME, // Railway'de oluşturduğunuz veritabanı adı
});

connection.connect((err) => {
  if (err) {
    console.error("MySQL bağlantısı başarısız:", err);
    return;
  }
  console.log("MySQL bağlantısı başarılı.");
});

module.exports = connection;
