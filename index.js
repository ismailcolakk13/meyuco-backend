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

// Etkinlikler tablosunu oluşturan endpoint
app.get("/api/create-table", (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS etkinlikler (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ad VARCHAR(255) NOT NULL,
      img VARCHAR(255) DEFAULT NULL,
      aciklama TEXT DEFAULT NULL,
      tarih DATE DEFAULT NULL,
      mekan VARCHAR(255) DEFAULT NULL,
      fiyat INT DEFAULT NULL,
      kategori ENUM('konserler','tiyatrolar','sporlar','sinemalar') DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Tablo oluşturulurken hata:", err);
      return res.status(500).send("Tablo oluşturulamadı");
    }
    res.send("Tablo başarıyla oluşturuldu!");
  });
});

// Etkinlikler tablosuna toplu veri ekleyen endpoint
app.post("/api/insert-entries", (req, res) => {
  const entries = [
    [1, 'Hayko Cepkin', '/images/hayko.jpg', 'Hayko Cepkin, sevilen şarkıları ve enerjik sahne performansıyla IF Performance Hall Ankara\'da!', '2025-06-22', 'IF Performance Hall Ankara', 450, 'konserler'],
    [2, 'AC/DC', '/images/ACDC.jpg', 'Efsanevi rock grubu AC/DC, unutulmaz şarkılarıyla İstanbul Olimpiyat Stadı\'nı sallamaya geliyor!', '2025-06-29', 'İstanbul Olimpiyat Stadı', 1200, 'konserler'],
    [3, 'Duman', '/images/duman.jpg', 'Türk rock müziğinin sevilen grubu Duman, Harbiye Cemil Topuzlu Açıkhava Tiyatrosu\'nda hayranlarıyla buluşuyor!', '2025-07-06', 'Harbiye Cemil Topuzlu Açıkhava Tiyatrosu', 600, 'konserler'],
    [4, 'Mor ve Ötesi', '/images/mvö.jpg', 'Mor ve Ötesi, en sevilen şarkıları ve yeni albümleriyle Turkcell Vadi\'de unutulmaz bir konsere imza atacak!', '2025-07-13', 'Turkcell Vadi', 550, 'konserler'],
    [5, 'Teoman', '/images/teoman.jpg', 'Teoman, akustik performansı ve duygusal şarkılarıyla IF Performance Hall Ankara\'da sevenleriyle buluşuyor.', '2025-06-28', 'IF Performance Hall Ankara', 500, 'konserler'],
    [6, 'Sertab Erener', '/images/ser.png', 'Sertab Erener, güçlü sesi ve unutulmaz şarkılarıyla Harbiye Cemil Topuzlu Açıkhava Tiyatrosu\'nda müzikseverlere unutulmaz bir gece yaşatacak!', '2025-07-05', 'Harbiye Cemil Topuzlu Açıkhava Tiyatrosu', 700, 'konserler'],
    [7, 'Kenan Doğulu', '/images/kenan.jpg', 'Kenan Doğulu, enerjik sahnesi ve sevilen şarkılarıyla Turkcell Vadi\'de hayranlarıyla buluşuyor!', '2025-07-12', 'Turkcell Vadi', 650, 'konserler'],
    [8, 'Yüksek Sadakat', '/images/ys.jpg', 'Yüksek Sadakat, güçlü şarkıları ve etkileyici performansıyla KadıköySahne\'de sevenleriyle buluşuyor!', '2025-07-19', 'KadıköySahne', 400, 'konserler'],
    [9, 'Mercaniye Çok Yaşa', '/images/tiyatro1.jpg', 'Komedi dolu bir Osmanlı parodisi.', '2025-06-12', 'Zorlu PSM', 350, 'tiyatrolar'],
    [10, 'Aydınlıkevler', '/images/tiyatro2.jpg', 'Toplumsal olaylara mizahi bakış.', '2025-06-18', 'Maximum UNIQ Hall', 300, 'tiyatrolar'],
    [11, 'Mor Komedyen Stand Up', '/images/tiyatro3.jpg', 'Sınırsız kahkaha garantili bir gösteri.', '2025-06-20', 'BKM Tiyatro', 250, 'tiyatrolar'],
    [12, 'Gökhan Ünvar Stand Up', '/images/tiyatro4.jpg', 'Klasiklerden sahne uyarlamaları.', '2025-06-25', 'DasDas Sahne', 200, 'tiyatrolar'],
    [13, 'Seyfi Bey', '/images/tiyatro5.jpg', 'Romantik komedi türünde sahne oyunu.', '2025-07-01', 'Kadıköy Halk Eğitim Merkezi', 220, 'tiyatrolar'],
    [14, 'Kutsal', '/images/tiyatro6.jpg', 'Derin karakter çözümlemeleri içerir.', '2025-07-03', 'Trump Sahne', 210, 'tiyatrolar'],
    [15, 'Kel Diva', '/images/tiyatro7.jpg', 'Absürt skeçlerden oluşur.', '2025-07-06', 'Cevahir Sahnesi', 180, 'tiyatrolar'],
    [16, 'Timsah Ateşi', '/images/tiyatro8.jpg', 'Çocuklar ve yetişkinler için kukla oyunu.', '2025-07-09', 'Sahne Dragos', 160, 'tiyatrolar'],
    [17, '1923 Müzikal', '/images/tiyatro9.jpg', 'Tarihi olaylara sahnede bir yolculuk.', '2025-07-12', 'Atatürk Kültür Merkezi', 400, 'tiyatrolar'],
    [18, 'Boğaz\'da Yoga', '/images/yoga.jpg', 'Rahatlatıcı bir yoga deneyimi.', '2025-07-10', 'Sait Halim Paşa Yalıs', 120, 'sporlar'],
    [19, 'Basketbol Maçı', '/images/basket.jpg', 'Heyecan dolu bir basketbol maçı.', '2025-07-12', 'Şişli Basketbol Salonu', 200, 'sporlar'],
    [20, 'Voleybol Maçı', '/images/voleybol11.jpg', 'Heyecan dolu bir voleybol maçı.', '2025-07-15', 'Avcılar Kampüs Voleybol Salonu', 180, 'sporlar'],
    [21, 'Boks Maçı', '/images/boks.jpg', 'Heyecan dolu bir boks maçı.', '2025-06-18', 'Florya Boks Salonu', 250, 'sporlar'],
    [22, 'Futbol Maçı', '/images/futbol.jpg', 'Fenerbahçe Galatasaray Derbisi.', '2025-07-20', 'Rams Park Stadyumu', 350, 'sporlar'],
    [23, 'Formula 1 Yarışı', '/images/formula1.jpg', 'Heyecan dolu bir Formula 1 yarışı.', '2025-07-25', 'İstanbul Park', 900, 'sporlar'],
    [24, 'Görevimiz Tehlike - Son Hesaplaşma', '/images/görevimizTehlike.jpg', 'Mission: Impossible - Ölümcül Hesaplaşma Birinci Bölüm\'ün bıraktığı yerden devam edecek olan film, Ethan Hunt ve ekibinin yanlış ellerde dünyanın sonunu getirebilecek bir AI programı olan The Entity\'ye ulaşma mücadelesini anlatıyor.', '2025-05-21', 'Meydan İstanbul AVM', 120, 'sinemalar'],
    [25, 'Lilo ve Stiç', '/images/lilovestic.jpg', 'Lilo ve Stiç, yalnız bir Hawaiili kız ile onun parçalanmış ailesini onarmaya yardım eden tuhaf bir uzaylının hikâyesini anlatıyor.', '2025-05-23', 'City\'s Nişantaşı', 110, 'sinemalar'],
    [26, 'Thunderbolts', '/images/thunderbolts.jpg', 'Thunderbolts filminde, alışılmışın dışında bir anti-kahraman ekibi bir araya geliyor: Yelena Belova, Bucky Barnes, Red Guardian, Ghost, Taskmaster ve John Walker. Valentina Allegra de Fontaine’in kurduğu ölümcül bir tuzağa düşen bu dışlanmış karakterler, geçmişlerinin en karanlık yönleriyle yüzleşmek zorunda kalacakları tehlikeli bir göreve çıkıyor.', '2025-05-02', 'Cineverse Akasya', 130, 'sinemalar'],
    [27, 'Kefenler', '/images/kefenler.jpg', 'Karısının ölümünden beri bir türlü teselli bulamayan Karsh, devrim niteliğinde ve tartışmalı bir teknoloji olan GraveTech’i icat eder. Bu teknoloji sayesinde geride kalanlar, kaybettiklerinin cesetlerini kefenleri içinde gözlemleyebileceklerdir. Bir gece, aralarında Karsh’ın eşininkinin de bulunduğu birçok mezar tahrip edilir. Karsh bu eylemin faillerinin izini sürmek için yola koyulur, ancak daha büyük, daha sinsi bir komplonun şüphesi de içini kemirmektedir.', '2025-05-26', 'Cineverse Emaar', 140, 'sinemalar'],
    [28, 'Örümcek Adam 3', '/images/spiderman3.jpg', 'Efsanevi Marvel Comics dizisine dayanan filmde, Peter Parker nihayet Mary Jane\'e duyduğu tutku ile süper kahramanlık görevleri arasındaki dengeyi kurar. Ancak, ufukta belirmeye başlayan bir fırtına vardır. Peter\'ın Örümcek Adam kostümü birden bire değişip siyaha dönüşerek güçlerini pekiştirmeye başlayınca, Peter da değişmeye başlar. Kostümün etkisi altındaki Peter, kibirli ve kendine aşırı güvenli biri olur; en değer verdiği kişileri ihmal etmeye başlar. Bugüne dek en korkulan iki kötü kahraman Kumadam ve Venom benzersiz güçler edinip, intikam ateşiyle yanarken, Peter en büyük savaşını kendi içinde yapmaktadır. Örümcek Adam\'ın onu o yapan, onu bir kahraman yapan özelliğini, yani şefkati yeniden keşfetmesi gerekecektir.', '2007-05-04', 'Cineverse Hilltown', 125, 'sinemalar']
  ];

  const sql = `INSERT INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES ?`;
  db.query(sql, [entries], (err, result) => {
    if (err) {
      console.error("Veriler eklenirken hata:", err);
      return res.status(500).send("Veriler eklenemedi");
    }
    res.send("Veriler başarıyla eklendi!");
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
