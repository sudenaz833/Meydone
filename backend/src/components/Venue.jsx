// Gerekli bileşenleri ve kütüphaneleri içe aktar
import { NavLink } from "react-router-dom"; // Sayfa yönlendirme için link bileşeni
import Rating from "./Rating"; // Yıldız puanlama bileşeni
import FoodAndDrinkList from "./FoodAndDrinkList"; // Yiyecek/içecek listesi bileşeni
import React from "react";
import { formatDistance } from "../services/Utils"; // Mesafe formatlama fonksiyonu

// Tek bir mekan kartı bileşeni - Mekan bilgilerini gösterir
const Venue = ({venue}) => {
  return (
    <div className="list-group">
      <div className="col-xs-12 col-sm-12">
        <div className="col-xs-12 list-group-item">
          {/* Mekan adı ve puanlama */}
          <h4>
            {/* Tıklanabilir mekan adı - Detay sayfasına yönlendirir */}
            <NavLink to={`/venue/${venue.id}`}>{venue.name} </NavLink>
            {/* Yıldız puanlama göster */}
            <Rating rating={venue.rating} />
          </h4>
          
          {/* Mesafe bilgisi (sağ üst köşede) */}
          <span className="span badge pull-right badge-default">
            {formatDistance(venue.distance)}
          </span>
          
          {/* Mekan adresi */}
          <p className="address"> {venue.address}</p>
          
          {/* Yiyecek ve içecek listesi */}
          <FoodAndDrinkList foodAndDrinkList={venue.foodanddrink} />
        </div>
      </div>
    </div>
  );
};

// Bileşeni dışa aktar
export default Venue;
