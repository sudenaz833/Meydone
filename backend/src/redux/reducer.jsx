// Redux Reducer - Uygulama state'ini yönetir
// Reducer, action'ları alır ve state'i günceller
// State değişiklikleri immutable (değiştirilemez) olmalıdır

// Başlangıç state'i - Uygulama ilk açıldığında bu değerler kullanılır
const initialState = {
  isError: false, // Hata durumu
  isLoading: false, // Yükleme durumu (API çağrıları için)
  isSuccess: false, // Başarı durumu
  data: [], // Mekan verileri
  user: {} // Kullanıcı bilgileri
}

// Reducer fonksiyonu - State ve action alır, yeni state döndürür
// state: Mevcut state
// action: Gönderilen action (type ve payload içerir)
const venueReducer = (state = initialState, action) => {
  // Action tipine göre state'i güncelle
  switch (action.type) {
    // Giriş başlatıldığında
    case "LOGIN_INIT":
      return {
        ...state, // Mevcut state'i kopyala (spread operator)
        isLoggedIn: false, // Giriş yapılmadı
        isError: false, // Hata yok
      };
    
    // Yorum ekleme başarılı
    case "ADD_COMMENT_SUCCESS":
      return {
        ...state,
        isSuccess: true, // Başarılı
      };
    
    // Yorum ekleme başarısız
    case "ADD_COMMENT_FAILURE":
      return {
        ...state,
        isSuccess: false, // Başarısız
        isError: true // Hata var
      };
    
    // Mekan ekleme/güncelleme başarılı
    case "ADD_UPDATE_VENUE_SUCCESS":
      return {
        ...state,
        isVenueAddedUpdated: true, // Mekan eklendi/güncellendi
        isError: false // Hata yok
      };
    
    // Mekan ekleme/güncelleme başarısız
    case "ADD_UPDATE_VENUE_FAILURE":
      return {
        ...state,
        isVenueAddedUpdated: false, // Mekan eklenmedi/güncellenmedi
        isError: true // Hata var
      };
    
    // Giriş başarılı
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isLoggedIn: true, // Giriş yapıldı
        user: action.payload, // Kullanıcı bilgilerini kaydet
        isError: false, // Hata yok
      };
    
    // Kayıt başarılı
    case "SIGNUP_SUCCESS":
      return {
        ...state,
        isSignedUp: true, // Kayıt başarılı
        user: action.payload, // Kullanıcı bilgilerini kaydet
        isError: false, // Hata yok
      };
    
    // Giriş başarısız
    case "LOGIN_FAILURE":
      return {
        ...state,
        isSignedUp: false, // Kayıt başarısız
        isError: true, // Hata var
      };
    
    // Veri çekme başlatıldı (API çağrısı başladı)
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true, // Yükleniyor
        isDeleted: false // Silinmedi
      };
    
    // Veri çekme başarılı
    case "FETCH_SUCCESS":
      return {
        ...state,
        isError: false, // Hata yok
        isLoading: false, // Yükleme tamamlandı
        isSuccess: true, // Başarılı
        data: action.payload, // Gelen veriyi kaydet
      };
    
    // Veri çekme başarısız
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false, // Yükleme tamamlandı (başarısız)
        isSuccess: false, // Başarısız
        isError: true, // Hata var
      };
    
    // Mekan silme başarılı
    case "REMOVE_VENUE_SUCCESS":
      return {
        ...state,
        isDeleted: true // Silindi
      };
    
    // Mekan silme başarısız
    case "REMOVE_VENUE_FAILURE":
      return {
        ...state,
        isDeleted: false // Silinmedi
      };
    
    // Tanımlı olmayan action'lar için başlangıç state'ini döndür
    default:
      return initialState;
  }
};

// Reducer'ı dışa aktar
export default venueReducer;
