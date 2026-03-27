// Gerekli bileşenleri içe aktar
import Venue from "./Venue"; // Tek bir mekan kartı bileşeni
import React from "react";

// Mekan listesi bileşeni - Birden fazla mekanı listeler
const VenueList = ({ venues}) => {
  return (
    <div>
      {/* Mekanlar varsa, her birini Venue bileşeni ile göster */}
      {/* map() fonksiyonu ile venues dizisindeki her elemanı döngüye al */}
      {/* key={index} = React'in her elemanı takip edebilmesi için benzersiz anahtar */}
      {venues? (venues.map((venue, index) => (
        <Venue key={index} venue={venue} />
      ))):("") // Mekan yoksa boş string göster
    }
    </div>
  );
};

// Bileşeni dışa aktar
export default VenueList;
