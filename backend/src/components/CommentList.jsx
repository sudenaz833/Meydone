// Gerekli bileşeni içe aktar
import Comment from "./Comment"; // Tek bir yorum bileşeni

// Yorum listesi bileşeni - Birden fazla yorumu listeler
const CommentList = ({ commentList }) => {
  // Yorum dizisindeki her bir yorumu Comment bileşeni ile göster
  // map() fonksiyonu ile commentList dizisindeki her elemanı döngüye al
  // key={index} = React'in her elemanı takip edebilmesi için benzersiz anahtar
  return commentList.map((comment, index) => (
    <Comment key={index} comment={comment} />
  ));
}

// Bileşeni dışa aktar
export default CommentList;
  