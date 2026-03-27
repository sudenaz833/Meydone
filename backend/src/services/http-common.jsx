// Axios kütüphanesini içe aktar
// Axios: HTTP istekleri (GET, POST, PUT, DELETE vb.) yapmak için kullanılan kütüphane
import axios from "axios";

// Axios instance oluştur - Tüm API istekleri için ortak yapılandırma
// Bu instance, her API çağrısında tekrar tekrar yapılandırma yapmamızı önler
export default axios.create({
  // Backend API'nin temel URL'i
  // Tüm API istekleri bu URL'e göre yapılır
  // Örnek: baseURL = "http://localhost:3000/api" ise
  // GET isteği -> "http://localhost:3000/api/venues" olur
  baseURL: "backendadresigelecek",
  
  // HTTP istek başlıkları (headers)
  // Her istekte otomatik olarak bu başlıklar gönderilir
  headers: {
    // Sunucudan JSON formatında veri beklediğimizi belirtir
    Accept: "application/json",
    
    // Gönderilen verinin formatını belirtir
    // application/x-www-form-urlencoded: Form verileri için kullanılır
    // charset=UTF-8: Türkçe karakter desteği için
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  },
});
