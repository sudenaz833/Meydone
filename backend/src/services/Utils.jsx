// Tarih formatlama fonksiyonu - Tarihi Türkçe formatta gösterir
// Örnek: "15 Ocak 2024" formatında döndürür
export function formatDate(date) {
    // Gelen tarihi Date objesine çevir
    var date = new Date(date);
    
    // Türkçe ay isimleri dizisi
    var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    
    // Gün bilgisini al (1-31 arası)
    var dateInfo = date.getDate();
    
    // Ay bilgisini al ve Türkçe ay ismine çevir
    // getMonth() 0-11 arası döndürür, bu yüzden months dizisinden doğru ayı alırız
    var monthInfo = months[date.getMonth()];
    
    // Yıl bilgisini al (örn: 2024)
    var yearInfo = date.getFullYear();
    
    // Tarihi birleştir: "15 Ocak 2024" formatında
    var result = dateInfo + ' ' + monthInfo + ' ' + yearInfo;
    
    return result;
}

// Mesafe formatlama fonksiyonu - Mesafeyi km veya m cinsinden gösterir
// 1 km'den büyükse km, küçükse metre cinsinden gösterir
export function formatDistance(distance) {
    var newDistance, unit;
    
    // Eğer mesafe 1 km'den büyükse
    if (distance > 1) {
      // Mesafeyi ondalıklı sayıya çevir ve 1 ondalık basamakla göster
      // Örnek: 2.5 -> "2.5 km"
      newDistance = parseFloat(distance).toFixed(1);
      unit = " km";
    } else {
      // Mesafe 1 km'den küçükse metreye çevir
      // distance * 1000 = metre cinsinden mesafe
      // parseInt ile ondalık kısmı atılır, sadece tam sayı gösterilir
      // Örnek: 0.5 km -> 500 m
      newDistance = parseInt(distance * 1000, 10);
      unit = " m";
    }
    
    // Formatlanmış mesafeyi döndür: "2.5 km" veya "500 m"
    return newDistance + unit;
};