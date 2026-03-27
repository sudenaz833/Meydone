// React kütüphanesini içe aktar
import React from "react";

// Etiketli input bileşeni - Label ve input alanını bir arada gösterir
const InputWithLabel = ({
    id, // Input'un benzersiz ID'si
    label, // Input'un üstünde gösterilecek etiket metni
    value, // Input'un başlangıç değeri
    type, // Input tipi (text, email, password vb.)
    onInputChange, // Input değeri değiştiğinde çalışacak fonksiyon
    isFocused, // Sayfa yüklendiğinde input'a otomatik odaklanılsın mı?
  }) => {
    // Input elementine referans oluştur (DOM'a erişim için)
    const inputRef = React.useRef();
    
    // Sayfa yüklendiğinde veya isFocused değiştiğinde çalışır
    React.useEffect(() => {
      // Eğer isFocused true ise ve input referansı varsa, input'a odaklan
      if (isFocused && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isFocused]);
    
    return (
      <div>
        {/* Input etiketi */}
        <label htmlFor={id}>{label}</label>&nbsp;
        
        {/* Input alanı */}
        <input
          id={id}
          type={type}
          defaultValue={value} // Başlangıç değeri
          onChange={onInputChange} // Değer değiştiğinde çalışacak fonksiyon
          ref={inputRef} // Input elementine referans bağla
        />
      </div>
    );
  };

// Bileşeni dışa aktar
export default InputWithLabel;