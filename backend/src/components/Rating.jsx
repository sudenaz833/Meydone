// Yıldız puanlama bileşeni - 1-5 arası puanı yıldız olarak gösterir
function Rating({ rating }) {
  const stars = []; // Yıldız elemanlarını tutacak dizi
  
  // Dolu yıldızları ekle (rating değeri kadar)
  // Örn: rating = 3 ise, 3 dolu yıldız eklenir
  for (let i = 0; i < rating; i++) {
    stars.push(
      <span className="glyphicon glyphicon-star" key={i}>
        {" "}
      </span>
    );
  }
  
  // Boş yıldızları ekle (5'e tamamlamak için)
  // Örn: rating = 3 ise, 2 boş yıldız eklenir (toplam 5 yıldız)
  for (let i = rating; i < 5; i++) {
    stars.push(
      <span className="glyphicon glyphicon-star-empty" key={i}>
        {" "}
      </span>
    );
  }
  
  // Oluşturulan yıldız dizisini döndür
  return stars;
}

// Bileşeni dışa aktar
export default Rating;
