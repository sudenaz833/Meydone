// Redux Toolkit'ten configureStore fonksiyonunu içe aktar
// configureStore: Redux store'unu oluşturmak için kullanılır
import { configureStore } from "@reduxjs/toolkit";

// Reducer'ı içe aktar - State yönetimini sağlayan fonksiyon
import venueReducer from "./reducer";

// Redux Store oluştur
// Store: Uygulamanın tüm state'ini tutan merkezi depo
// configureStore: Store'u yapılandırır ve reducer'ı bağlar
// reducer: State değişikliklerini yöneten fonksiyon
const store = configureStore({
  reducer: venueReducer // venueReducer'ı ana reducer olarak kullan
});

// Store'u dışa aktar - Diğer dosyalarda kullanmak için
// main.jsx'te Provider ile tüm uygulamaya sağlanır
export default store;
