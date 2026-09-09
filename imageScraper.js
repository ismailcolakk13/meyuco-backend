const db = require('./db.js');
const pool = db.pool || db;

// DuckDuckGo'nun yapısını tırnak karmaşası olmadan düz string birleştirmeyle çağıran fonksiyon
// DuckDuckGo resim arama servisini doğru URL yapılarıyla çağıran fonksiyon
async function fetchEventImageUrl(eventName) {
    try {
        // 1. ADIM: Arama sayfasından vqd (kimlik) token'ını alıyoruz
        // Doğru URL: https://duckduckgo.com/?q=Arama+Kelimesi
        const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(eventName)}`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenText = await tokenResponse.text();

        // Düzenli ifade (Regex) ile vqd değerini ayıklıyoruz
        const vqdMatch = tokenText.match(/vqd=([\d-]+)/);
        if (!vqdMatch) return null;
        const vqd = vqdMatch[1];

        // 2. ADIM: Aldığımız token ile gizli resim API'sine istek atıyoruz
        // Doğru URL: https://duckduckgo.com/i.js?q=Arama+Kelimesi&vqd=Token&f=,,,
        const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(eventName)}&vqd=${vqd}&f=,,,`;
        const apiResponse = await fetch(apiUrl);
        const apiText = await apiResponse.text();

        // Dönen JSON verisi içindeki ilk görsel linkini yakalıyoruz
        const imageMatch = apiText.match(/\"image\":\"(http[s]?:\/\/[^\"]+)\"/);
        if (imageMatch && imageMatch[1]) {
            // Ters eğik çizgileri temizleyip temiz URL dönüyoruz
            return imageMatch[1].replace(/\\/g, '');
        }
        return null;
    } catch (error) {
        console.error(`❌ Görsel arama motoru hatası (${eventName}):`, error.message);
        return null;
    }
}

// Eksik resimleri bulup PostgreSQL'i güncelleyen ana fonksiyon
async function updateMissingImages() {
    try {
        console.log("🔄 PostgreSQL veritabanında yerel/eksik etkinlik görselleri taranıyor...");

        // init.sql dosyanızdaki gerçek kolon isimleri: ad, kategori, img, etkinlikler
        const queryResult = await pool.query(
            `SELECT id, ad, kategori FROM etkinlikler WHERE img IS NULL OR img = '' OR img LIKE '/images/%'`
        );
        const missingEvents = queryResult.rows;

        if (missingEvents.length === 0) {
            console.log("✨ Harika! Tüm etkinliklerin görselleri canlı linklerle güncellenmiş.");
            return;
        }

        console.log("[PostgreSQL] " + missingEvents.length + " adet yerel/eksik görsellere sahip etkinlik bulundu. İşlem başlatılıyor...");

        for (const event of missingEvents) {
            const searchQuery = event.ad + " " + event.kategori;
            console.log("🔍 İnternette aranıyor: " + searchQuery);

            const foundImageUrl = await fetchEventImageUrl(searchQuery);

            if (foundImageUrl) {
                await pool.query(
                    `UPDATE etkinlikler SET img = $1 WHERE id = $2`,
                    [foundImageUrl, event.id]
                );
                console.log("✅ " + event.ad + " için gerçek görsel veritabanına başarıyla işlendi!");
            } else {
                console.log("⚠️ " + event.ad + " için internette uygun görsel bulunamadı.");
            }

            // Engellenmemek (Rate Limit) için araya 1.5 saniye bekleme koyuyoruz
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        console.log("🏁 Görsel güncelleme süreci başarıyla tamamlandı!");
    } catch (error) {
        console.error("💥 Güncelleme sürecinde kritik hata meydana geldi:", error);
    }
}

module.exports = { updateMissingImages };
