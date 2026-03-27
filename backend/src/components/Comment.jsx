// Gerekli bileşenleri ve fonksiyonları içe aktar
import Rating from "./Rating"; // Yıldız puanlama bileşeni
import {formatDate} from "../services/Utils"; // Tarih formatlama fonksiyonu

// Tek bir yorum bileşeni - Kullanıcı yorumunu gösterir
const Comment = ({ comment, index }) => {
  
  return (
    <div key={index} className="row">
      <div className="review">
        {/* Yorum başlığı - Puan, yazar ve tarih */}
        <div className="well well-sm review-header ">
          {/* Yıldız puanlama */}
          <span className="rating">
            <Rating puan={comment.rating} />
          </span>
          &nbsp; {/* Boşluk */}
          
          {/* Yorum yazarının adı */}
          <span className="review-author">{comment.author}</span>
          &nbsp; {/* Boşluk */}
          
          {/* Yorum tarihi (küçük yazı) */}
          <small className="reviewTimestamp">{formatDate(new Date())}</small>
        </div>
        
        {/* Yorum metni */}
        <div className="col-xs-12 ">{comment.text}</div>
      </div>
    </div>
  );
};

// Bileşeni dışa aktar
export default Comment;
