const Iyzipay = require("iyzipay");

// iyzico İstemcisi
const apiKey = process.env.IYZICO_API_KEY;
const secretKey = process.env.IYZICO_SECRET_KEY;
const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

let iyzipayClient = null;
if (apiKey && secretKey && apiKey !== "sandbox-api-key") {
  iyzipayClient = new Iyzipay({
    apiKey,
    secretKey,
    uri: baseUrl,
  });
  console.log("💳 [IYZICO] Gerçek/Sandbox iyzico istemcisi yapılandırıldı.");
} else {
  console.log("ℹ️ [IYZICO] IYZICO_API_KEY tanımlanmamış. Geliştirme/Simülasyon modunda çalışacak.");
}

/**
 * iyzico doğrudan kart ödemesi (Non-3DS / Direct Payment)
 * @param {Object} params
 * @param {Object} params.user Kullanıcı bilgisi ({ id, name, email })
 * @param {Object} params.etkinlik Etkinlik bilgisi ({ id, ad, fiyat, kategori })
 * @param {number} params.tutar Toplam ödenecek tutar
 * @param {Object} params.kart Kart bilgileri ({ isim, kartNo, sonKullanma, cvc })
 * @param {string} params.clientIp İstemci IP adresi
 * @returns {Promise<Object>} iyzico sonuç nesnesi
 */
function createDirectPayment({ user, etkinlik, tutar, kart, clientIp = "127.0.0.1" }) {
  return new Promise((resolve, reject) => {
    // Eğer API anahtarı girilmemişse veya mock modundaysa gerçekçi simülasyon yanıtı üret
    if (!iyzipayClient) {
      setTimeout(() => {
        const cleanNo = (kart.kartNo || "").replace(/\s+/g, "");
        // Başarısızlık simülasyonu için özel test kartları
        if (cleanNo.endsWith("0000") || cleanNo === "4000000000000000") {
          return resolve({
            status: "failure",
            errorCode: "51",
            errorMessage: "Kart limiti yetersiz veya işlem banka tarafından reddedildi.",
          });
        }

        return resolve({
          status: "success",
          paymentId: "MOCK_PAY_" + Date.now(),
          conversationId: "CONV_" + Date.now(),
          price: tutar,
          paidPrice: tutar,
          currency: "TRY",
          basketId: "BASKET_" + Date.now(),
          isMock: true,
        });
      }, 700);
      return;
    }

    // Kart son kullanma tarihini ayır (MM/YY)
    const [rawMonth, rawYear] = (kart.sonKullanma || "").split("/");
    const expireMonth = (rawMonth || "").trim().padStart(2, "0");
    let expireYear = (rawYear || "").trim();
    if (expireYear.length === 2) {
      expireYear = "20" + expireYear;
    }

    const cleanCardNo = (kart.kartNo || "").replace(/\s+/g, "");

    // İsim Soyisim ayır
    const fullName = (kart.isim || user.name || "Meyuco Musteri").trim();
    const nameParts = fullName.split(/\s+/);
    const buyerName = nameParts[0] || "Meyuco";
    const buyerSurname = nameParts.slice(1).join(" ") || "Musteri";

    const conversationId = `CONV_${Date.now()}_${user.id || "0"}`;
    const priceFormatted = Number(tutar).toFixed(2);

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: priceFormatted,
      paidPrice: priceFormatted,
      currency: Iyzipay.CURRENCY.TRY,
      installment: "1",
      basketId: `BSK_${Date.now()}`,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardHolderName: fullName,
        cardNumber: cleanCardNo,
        expireMonth: expireMonth,
        expireYear: expireYear,
        cvc: (kart.cvc || "").trim(),
        registerCard: "0",
      },
      buyer: {
        id: String(user.id || "1"),
        name: buyerName,
        surname: buyerSurname,
        gsmNumber: "+905350000000",
        email: user.email || "musteri@meyuco.com",
        identityNumber: "11111111110",
        lastLoginDate: "2025-01-01 12:00:00",
        registrationDate: "2025-01-01 12:00:00",
        registrationAddress: "Meyuco Merkez Mah.",
        ip: clientIp || "127.0.0.1",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34732",
      },
      shippingAddress: {
        contactName: fullName,
        city: "Istanbul",
        country: "Turkey",
        address: "Meyuco Dijital Bilet Teslimati",
        zipCode: "34732",
      },
      billingAddress: {
        contactName: fullName,
        city: "Istanbul",
        country: "Turkey",
        address: "Meyuco Dijital Bilet Teslimati",
        zipCode: "34732",
      },
      basketItems: [
        {
          id: `ETK_${etkinlik.id}`,
          name: (etkinlik.ad || "Etkinlik Bileti").substring(0, 50),
          category1: (etkinlik.kategori || "Bilet").substring(0, 50),
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: priceFormatted,
        },
      ],
    };

    iyzipayClient.payment.create(request, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}

module.exports = {
  createDirectPayment,
  isConfigured: () => iyzipayClient !== null,
};

