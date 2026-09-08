-- Meyuco DB Init Script
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS meyuco_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE meyuco_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT "user",
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS etkinlikler (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad VARCHAR(255) NOT NULL,
  img TEXT,
  aciklama TEXT,
  tarih VARCHAR(50),
  mekan VARCHAR(255),
  fiyat DECIMAL(10, 2),
  kategori VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS biletler (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  etkinlik_id INT NOT NULL,
  adet INT DEFAULT 1,
  koltuk VARCHAR(255) DEFAULT NULL,
  satin_alma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id) ON DELETE CASCADE
);

-- Default Users
INSERT INTO users (email, password, name, role) VALUES
('admin@meyuco.com', 'admin123', 'Admin Meyuco', 'admin'),
('user@meyuco.com', 'user123', 'Demo User', 'user')
ON DUPLICATE KEY UPDATE id=id;

-- Events
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (1, 'Hayko Cepkin', '/images/hayko.jpg', 'Hayko Cepkin, sevilen şarkıları ve enerjik sahne performansıyla IF Performance Hall Ankara''da!', '22/06/2025', 'IF Performance Hall Ankara', 450, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (2, 'AC/DC', '/images/ACDC.jpg', 'Efsanevi rock grubu AC/DC, unutulmaz şarkılarıyla İstanbul Olimpiyat Stadı''nı sallamaya geliyor!', '29/06/2025', 'İstanbul Olimpiyat Stadı', 1200, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (3, 'Duman', '/images/duman.jpg', 'Türk rock müziğinin sevilen grubu Duman, Harbiye Cemil Topuzlu Açıkhava Tiyatrosu''nda hayranlarıyla buluşuyor!', '06/07/2025', 'Harbiye Cemil Topuzlu Açıkhava Tiyatrosu', 600, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (4, 'Mor ve Ötesi', '/images/mvö.jpg', 'Mor ve Ötesi, en sevilen şarkıları ve yeni albümleriyle Turkcell Vadi''de unutulmaz bir konsere imza atacak!', '13/07/2025', 'Turkcell Vadi', 550, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (5, 'Teoman', '/images/teoman.jpg', 'Teoman, akustik performansı ve duygusal şarkılarıyla IF Performance Hall Ankara''da sevenleriyle buluşuyor.', '28/06/2025', 'IF Performance Hall Ankara', 500, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (6, 'Sertab Erener', '/images/ser.png', 'Sertab Erener, güçlü sesi ve unutulmaz şarkılarıyla Harbiye Cemil Topuzlu Açıkhava Tiyatrosu''nda müzikseverlere unutulmaz bir gece yaşatacak!', '05/07/2025', 'Harbiye Cemil Topuzlu Açıkhava Tiyatrosu', 700, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (7, 'Kenan Doğulu', '/images/kenan.jpg', 'Kenan Doğulu, enerjik sahnesi ve sevilen şarkılarıyla Turkcell Vadi''de hayranlarıyla buluşuyor!', '12/07/2025', 'Turkcell Vadi', 650, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (8, 'Yüksek Sadakat', '/images/ys.jpg', 'Yüksek Sadakat, güçlü şarkıları ve etkileyici performansıyla KadıköySahne''de sevenleriyle buluşuyor!', '19/07/2025', 'KadıköySahne', 400, 'konserler');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (9, 'Mercaniye Çok Yaşa', '/images/tiyatro1.jpg', 'Komedi dolu bir Osmanlı parodisi.', '12/06/2025', 'Zorlu PSM', 350, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (10, 'Aydınlıkevler', '/images/tiyatro2.jpg', 'Toplumsal olaylara mizahi bakış.', '18/06/2025', 'Maximum UNIQ Hall', 300, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (11, 'Mor Komedyen Stand Up', '/images/tiyatro3.jpg', 'Sınırsız kahkaha garantili bir gösteri.', '20/06/2025', 'BKM Tiyatro', 250, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (12, 'Gökhan Ünvar Stand Up', '/images/tiyatro4.jpg', 'Klasiklerden sahne uyarlamaları.', '25/06/2025', 'DasDas Sahne', 200, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (13, 'Seyfi Bey ', '/images/tiyatro5.jpg', 'Romantik komedi türünde sahne oyunu.', '01/07/2025', 'Kadıköy Halk Eğitim Merkezi', 220, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (14, 'Kutsal', '/images/tiyatro6.jpg', 'Derin karakter çözümlemeleri içerir.', '03/07/2025', 'Trump Sahne', 210, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (15, 'Kel Diva', '/images/tiyatro7.jpg', 'Absürt skeçlerden oluşur.', '06/07/2025', 'Cevahir Sahnesi', 180, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (16, 'Timsah Ateşi', '/images/tiyatro8.jpg', 'Çocuklar ve yetişkinler için kukla oyunu.', '09/07/2025', 'Sahne Dragos', 160, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (17, '1923 Müzikal', '/images/tiyatro9.jpg', 'Tarihi olaylara sahnede bir yolculuk.', '12/07/2025', 'Atatürk Kültür Merkezi', 400, 'tiyatrolar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (18, 'Boğaz''da Yoga', '/images/yoga.jpg', 'Rahatlatıcı bir yoga deneyimi.', '10/07/2025', 'Sait Halim Paşa Yalıs', 120, 'sporlar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (19, 'Basketbol Maçı', '/images/basket.jpg', 'Heyecan dolu bir basketbol maçı.', '12/07/2025', 'Şişli Basketbol Salonu', 200, 'sporlar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (20, 'Voleybol Maçı', '/images/voleybol11.jpg', 'Heyecan dolu bir voleybol maçı.', '15/07/2025', 'Avcılar Kampüs Voleybol Salonu', 180, 'sporlar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (21, 'Boks Maçı', '/images/boks.jpg', 'Heyecan dolu bir boks maçı.', '18/06/2025', 'Florya Boks Salonu', 250, 'sporlar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (22, 'Futbol Maçı', '/images/futbol.jpg', 'Fenerbahçe Galatasaray Derbisi.', '20/07/2025', 'Rams Park Stadyumu', 350, 'sporlar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (23, 'Formula 1 Yarışı', '/images/formula1.jpg', 'Heyecan dolu bir Formula 1 yarışı.', '25/07/2025', 'İstanbul Park', 900, 'sporlar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (24, 'Görevimiz Tehlike - Son Hesaplaşma', '/images/görevimizTehlike.jpg', 'Mission: Impossible - Ölümcül Hesaplaşma Birinci Bölüm''ün bıraktığı yerden devam edecek olan film, Ethan Hunt ve ekibinin yanlış ellerde dünyanın sonunu getirebilecek bir AI programı olan The Entity''ye ulaşma mücadelesini anlatıyor.', '21/05/2025', 'Meydan İstanbul AVM', 120, 'sinemalar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (25, 'Lilo ve Stiç', '/images/lilovestic.jpg', 'Lilo ve Stiç, yalnız bir Hawaiili kız ile onun parçalanmış ailesini onarmaya yardım eden tuhaf bir uzaylının hikâyesini anlatıyor.', '23/05/2025', 'City''s Nişantaşı', 110, 'sinemalar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (26, 'Thunderbolts', '/images/thunderbolts.jpg', 'Thunderbolts filminde, alışılmışın dışında bir anti-kahraman ekibi bir araya geliyor: Yelena Belova, Bucky Barnes, Red Guardian, Ghost, Taskmaster ve John Walker. Valentina Allegra de Fontaine’in kurduğu ölümcül bir tuzağa düşen bu dışlanmış karakterler, geçmişlerinin en karanlık yönleriyle yüzleşmek zorunda kalacakları tehlikeli bir göreve çıkıyor.', '02/05/2025', 'Cineverse Akasya', 130, 'sinemalar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (27, 'Kefenler', '/images/kefenler.jpg', 'Karısının ölümünden beri bir türlü teselli bulamayan Karsh, devrim niteliğinde ve tartışmalı bir teknoloji olan GraveTech’i icat eder. Bu teknoloji sayesinde geride kalanlar, kaybettiklerinin cesetlerini kefenleri içinde gözlemleyebileceklerdir. Bir gece, aralarında Karsh’ın eşininkinin de bulunduğu birçok mezar tahrip edilir. Karsh bu eylemin faillerinin izini sürmek için yola koyulur, ancak daha büyük, daha sinsi bir komplonun şüphesi de içini kemirmektedir.', '26/05/2025', 'Cineverse Emaar', 140, 'sinemalar');
REPLACE INTO etkinlikler (id, ad, img, aciklama, tarih, mekan, fiyat, kategori) VALUES (28, 'Örümcek Adam 3', '/images/spiderman3.jpg', 'Efsanevi Marvel Comics dizisine dayanan filmde, Peter Parker nihayet Mary Jane''e duyduğu tutku ile süper kahramanlık görevleri arasındaki dengeyi kurar. Ancak, ufukta belirmeye başlayan bir fırtına vardır. Peter''ın Örümcek Adam kostümü birden bire değişip siyaha dönüşerek güçlerini pekiştirmeye başlayınca, Peter da değişmeye başlar. Kostümün etkisi altındaki Peter, kibirli ve kendine aşırı güvenli biri olur; en değer verdiği kişileri ihmal etmeye başlar. Bugüne dek en korkulan iki kötü kahraman Kumadam ve Venom benzersiz güçler edinip, intikam ateşiyle yanarken, Peter en büyük savaşını kendi içinde yapmaktadır. Örümcek Adam''ın onu o yapan, onu bir kahraman yapan özelliğini, yani şefkati yeniden keşfetmesi gerekecektir.', '04/05/2007', 'Cineverse Hilltown', 125, 'sinemalar');
