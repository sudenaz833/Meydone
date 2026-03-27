// Gerekli bileşeni içe aktar
import Header from "./Header"; // Sayfa başlığı bileşeni

// 404 (Sayfa Bulunamadı) sayfası bileşeni
// Kullanıcı var olmayan bir URL'ye gittiğinde gösterilir
function PageNotFound() {
  return (
    <div>
      {/* Hata mesajı başlığı */}
      <Header headerText="Hata" motto="Sayfa Bulunamadı!" />
    </div>
  );
}

// Bileşeni dışa aktar
export default PageNotFound;
