// Gerekli bileşenleri içe aktar
import InputWithLabel from "./InputWithLabel"; // Arama kutusu bileşeni
import VenueList from "./VenueList"; // Mekan listesi bileşeni
import Header from "./Header"; // Başlık bileşeni
import React, { useState } from "react"; // React ve state hook'u
import venuesData from "../data/venues.json"; // Mekan verileri (JSON dosyasından)

// Ana sayfa bileşeni
const Home = () => {
  // Mekan verileri JSON dosyasından alınır (normalde API'den gelecek)
  // Bu sayede veriler tek bir yerde tutulur ve değişiklikler kolaylaşır
  const venues = venuesData;
  
  // Arama metni için state tanımla
  const [searchVenue, setSearchVenue] = useState("");
  
  // Arama kutusuna yazıldığında çalışan fonksiyon
  const search = (event) => {
    setSearchVenue(event.target.value);
  };
  
  // Bileşen yüklendiğinde çalışacak (şu an boş)
  // Boş dizi [] = Bu effect sadece bileşen ilk yüklendiğinde 1 kez çalışır
  // Eğer dizi içinde değişken olsaydı, o değişken her değiştiğinde tekrar çalışırdı
  React.useEffect(() => {

  }, []);

  // Mekanları arama metnine göre filtrele
  // Mekan adı, arama metnini içeriyorsa listede göster
  const filteredVenues = Array.isArray(venues) ? venues.filter((venue) => {
    return venue.name.toLowerCase().includes(searchVenue.toLowerCase());
  }) : [];
  
  return (
    <div>
      {/* Sayfa başlığı ve slogan */}
      <Header
        headerText="Meydone"
        motto="Civarınızdaki Mekanlarınızı Keşfedin!"
      />
      
      {/* Arama kutusu */}
      <InputWithLabel
        id="arama"
        label="Mekan Ara:"
        type="text"
        isFocused
        onInputChange={search}
        value={searchVenue}
      />
      
      <hr />
      
      {/* Mekan listesi */}
      <div className="row">
        <div className="row">
          {/* Filtrelenmiş mekanları listele */}
          <VenueList venues={filteredVenues} />
        </div>
      </div>
    </div>
  );
};

// Bileşeni dışa aktar
export default Home;
