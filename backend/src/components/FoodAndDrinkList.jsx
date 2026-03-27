// Yiyecek ve içecek listesi bileşeni - Mekanın sunduğu yiyecek/içecekleri etiket olarak gösterir
const FoodAndDrinkList = ({ foodAndDrinkList }) => {
  // Dizideki her bir yiyecek/içecek için etiket oluştur
  return foodAndDrinkList.map((fan, index) => (
    <span key={index}>
      {/* Her bir yiyecek/içecek sarı etiket (badge) olarak gösterilir */}
      <span className="label label-warning"> {fan}</span>
      {/* Etiketler arasında boşluk bırak */}
      &nbsp;
    </span>
  ));
};

// Bileşeni dışa aktar
export default FoodAndDrinkList;
