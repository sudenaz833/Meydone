// Gerekli bileşenleri içe aktar
import Header from "./Header"; // Sayfa başlığı bileşeni

// Hakkında sayfası bileşeni - Uygulama hakkında bilgi gösterir
function About() {
  return (
    <div>
      {/* Sayfa başlığı ve slogan */}
      <Header
        headerText="Meydone"
        motto="ReactJS Single Page Application (SPA)"
      />
    </div>
  );
}

// Bileşeni dışa aktar
export default About;
