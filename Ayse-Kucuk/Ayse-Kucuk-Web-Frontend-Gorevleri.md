# Meydone'ın Web Frontend Görevleri

**Web Frontend Adresi:** [frontend.meydone.com](https://meydone.vercel.app)

**Front-end Test Videosu:** [https://youtu.be/tZIPYzmXpm0]

## 1. Saat Güncelleme Sayfası (Admin)

- **API Endpoint:** `PUT /admin/venues/{id}/hours`
- **UI Bileşenleri:**
  - Gün bazlı açılış/kapanış saati seçicileri (TimePicker).
  - "Tatil/Kapalı" durumunu belirleyen Switch (Toggle) bileşeni.
  - Değişiklikleri kaydetmek için "Saatleri Güncelle" butonu.
  - İşlem sürerken gösterilecek Loading Spinner.
- **Form Validasyonu:**
  - Kapanış saatinin açılış saatinden ileri bir saat olması zorunluluğu.
  - Saat alanlarının boş bırakılamaması (Required validation).
  - Geçersiz format (Örn: 25:00) girişinin engellenmesi.
- **Kullanıcı Deneyimi:**
  - Hatalı girişlerde form altında kırmızı uyarı metinleri (Inline validation).
  - Başarılı işlem sonrası yeşil renkli "Başarıyla güncellendi" bildirimi (Toast).
  - Kaydedilmemiş değişiklik varken sayfadan çıkılmak istendiğinde browser uyarısı.
- **Teknik Detaylar:**
  - Form state yönetimi (React Hook Form veya Formik).
  - İstek başlığına (Header) Admin JWT Token'ın Interceptor ile eklenmesi.
  - Zaman hesaplamaları için `date-fns` veya `moment.js` kütüphanesi kullanımı.

## 2. Konum Güncelleme Sayfası (Admin)

- **API Endpoint:** `PUT /admin/venues/{id}/location`
- **UI Bileşenleri:**
  - İnteraktif Harita Bileşeni (Google Maps veya Leaflet).
  - Enlem (Latitude) ve Boylam (Longitude) input alanları.
  - Harita üzerinde sürüklenebilir Konum İşaretçisi (Marker).
  - "Konumu Kaydet" butonu.
- **Form Validasyonu:**
  - Enlem (Latitude) değerinin -90 ile 90 arasında olması kontrolü.
  - Boylam (Longitude) değerinin -180 ile 180 arasında olması kontrolü.
  - Koordinat alanlarının sadece sayısal değer kabul etmesi (Float regex).
- **Kullanıcı Deneyimi:**
  - Haritada bir noktaya tıklandığında input alanlarının otomatik dolması.
  - Kullanıcının manuel veri girmesi durumunda haritadaki pimin eşzamanlı hareket etmesi.
  - Yükleme durumunda harita üzerinde skeleton veya loader gösterimi.
- **Teknik Detaylar:**
  - Geocoding işlemleri ile koordinat dönüşümü.
  - Koordinat verilerinin veritabanına 6 haneli hassasiyetle iletilmesi.
  - Responsive harita renderlama işlemi.

## 3. Menü Güncelleme Sayfası (Admin)

- **API Endpoint:** `PUT /admin/venues/{id}/menu`
- **UI Bileşenleri:**
  - Kategori ve ürünleri gösteren dinamik liste yapısı (Accordion/List).
  - Yeni ürün ekleme formu (Ürün adı, fiyatı).
  - Ürün silme ve düzenleme ikonları.
  - "Menüyü Kaydet" butonu.
- **Form Validasyonu:**
  - Ürün adının boş olamaması ve maksimum karakter sınırı.
  - Fiyat alanının 0'dan büyük olması ve sadece rakam/virgül kabul etmesi.
  - Aynı kategori altında aynı isimde iki ürün eklenmesinin engellenmesi (Client-side duplication check).
- **Kullanıcı Deneyimi:**
  - Fiyat girerken anlık para birimi formatlaması (Örn: 85,00 TL).
  - Sürükle-bırak (Drag & Drop) ile ürün sırasını değiştirme.
  - Menü çok uzun olduğunda "Kaydet" butonunun ekrana sabitlenmesi (Sticky button).
- **Teknik Detaylar:**
  - Sınırsız liste girişi için dinamik FieldArray yönetimi.
  - Gereksiz renderları önlemek için girişlerde Debouncing kullanımı.
  - UI state'inin API'nin beklediği JSON Object Array formatına dönüştürülmesi.

## 4. Şifre Güncelleme Sayfası (Profil Üzerinden)

- **API Endpoint:** `PUT /auth/update-password` _(Not: Projenizdeki güncel endpoint'e göre `/users/{id}/password` olarak da değiştirilebilir)_
- **UI Bileşenleri:**
  - Profil ayarları içerisinde "Şifre Değiştir" sekmesi veya formu.
  - "Mevcut Şifre" (Current Password) input alanı.
  - "Yeni Şifre" (New Password) input alanı (Şifre gücü barı ile).
  - "Yeni Şifre Tekrar" (Confirm Password) input alanı.
  - Şifreleri gizle/göster (Göz ikonu) butonu.
  - "Şifreyi Güncelle" primary butonu.
- **Form Validasyonu:**
  - Yeni şifre ve Yeni şifre tekrar alanlarının birebir eşleşmesi (Match validation).
  - Yeni şifrenin, mevcut şifre ile aynı olmaması kontrolü.
  - Şifre güçlülük kuralları (En az 8 karakter).
  - Tüm alanlar kurallara uygun doldurulmadan kaydet butonunun inaktif (disabled) kalması.
- **Kullanıcı Deneyimi:**
  - Başarılı güncelleme sonrası yeşil renkli "Şifreniz başarıyla güncellendi" bildirimi (Toast/Snackbar) ve inputların temizlenmesi.
  - Mevcut şifre yanlış girildiğinde "Mevcut şifreniz hatalı" uyarı mesajının ilgili inputun altında (Inline) gösterilmesi.
  - Güvenlik hissini artırmak için işlem sırasında Loading spinner gösterimi.
- **Teknik Detaylar:**
  - İstek başlığına (Header) kullanıcının mevcut JWT Token'ının (Bearer Token) otomatik eklenmesi.
  - Yetkisiz işlem (403 Forbidden) veya hatalı şifre (401 Unauthorized) dönmesi durumunda Axios/Fetch hata yakalama (Error Catching) mekanizması.
  - Güvenlik sebebiyle input verilerinin sadece komponent state'inde (örn: `useState`) tutulması ve kalıcı storage'a (localStorage) kesinlikle kaydedilmemesi.

## 5. Favori Mekan Ekleme Akışı

- **API Endpoint:** `POST /favorites`
- **UI Bileşenleri:**
  - Mekan detay ve listeleme kartlarında Kalp (Heart) butonu.
  - Favoriye ekleme durumunu gösteren tooltipler.
- **Form Validasyonu:**
  - İstek atılmadan önce kullanıcı oturumunun (Token) var olup olmadığının kontrolü.
  - `venueId` parametresinin boş veya tanımsız (undefined) olmasının engellenmesi.
- **Kullanıcı Deneyimi:**
  - Kalbe tıklandığında anında dolgu renginin değişmesi (Mikro-interaksiyon).
  - İşlem başarılı olduğunda ekranın altında "Favorilerinize eklendi" yazan bir Snackbar açılması.
- **Teknik Detaylar:**
  - Optimistic UI yaklaşımı (Sunucu yanıtı beklemeden UI güncellemesi).
  - Global state (Redux/Context API) üzerinden profil sayfasındaki favori sayacının senkronize edilmesi.
  - API'den 401 Unauthorized dönerse kullanıcının login sayfasına yönlendirilmesi.

## 6. Favori Mekan Silme Akışı

- **API Endpoint:** `DELETE /favorites/{venuesId}`
- **UI Bileşenleri:**
  - Favoriler sayfasındaki listelenmiş mekan kartları.
  - Kart üzerinde "Favorilerden Çıkar" veya "X" ikonu.
  - Onay penceresi (Confirmation Dialog).
- **Form Validasyonu:**
  - URL'e eklenecek `venuesId` parametresinin geçerli bir string/ObjectId olup olmadığının kontrolü.
- **Kullanıcı Deneyimi:**
  - Yanlışlıkla silmeyi önlemek için "Bu mekanı favorilerden çıkarmak istediğinize emin misiniz?" onay adımı.
  - İşlem sonrası mekanın listeden yumuşak bir animasyonla (Fade out) kaybolması.
  - Liste boşaldığında "Henüz favori mekanınız yok" şeklinde Empty State tasarımı.
- **Teknik Detaylar:**
  - Array Filter metodu ile silinen ID'nin state içerisinden anında ayıklanması.
  - İşlem esnasında başka butonlara tıklanmasını önleyen disabled state yönetimi.
  - HTTP DELETE metoduna uygun request yapılandırması.

## 7. Arkadaş Ekleme Akışı

- **API Endpoint:** `POST /friends/request`
- **UI Bileşenleri:**
  - Kullanıcı arama çubuğu (Search Input).
  - Arama sonuçlarında çıkan kullanıcı kartları.
  - "Arkadaş Ekle" butonu.
- **Form Validasyonu:**
  - Body içerisine gidecek `friendId` veya `username` verisinin boş olmaması.
  - Kullanıcının kendi kendine istek atmasının arayüz tarafında engellenmesi.
- **Kullanıcı Deneyimi:**
  - Butona tıklandıktan sonra metnin "İstek Gönderildi" olarak değişmesi ve tıklanamaz (disabled) hale gelmesi.
  - Zaten arkadaş olunan kişilerde butonun hiç gösterilmemesi veya pasif olması.
  - 409 Conflict durumlarında "Zaten arkadaşlık isteği gönderilmiş" uyarı mesajı.
- **Teknik Detaylar:**
  - Arama çubuğunda API yükünü hafifletmek için 300ms Debounce kullanılması.
  - `currentUser` ile aranan kullanıcıların ID kıyaslamalarının yapılması.
  - Başarılı istek sonrası component state'inin güncellenmesi.

## 8. Arkadaşlık İsteği Bildirimi Paneli

- **API Endpoint:** `GET /notifications/friend-requests`
- **UI Bileşenleri:**
  - Navigasyon barında Bildirim Zili (Notification Bell).
  - Okunmamış istek sayısını gösteren Kırmızı Rozet (Badge).
  - Tıklanınca açılan bildirim listesi (Dropdown menu).
  - Her bir istek için "Kabul Et" (Primary) ve "Reddet" (Danger) butonları.
- **Form Validasyonu:**
  - Listelenen verilerin geçerli kullanıcı objeleri içerip içermediğinin (Null check) kontrolü.
- **Kullanıcı Deneyimi:**
  - Bekleyen bir istek yoksa listeye tıklandığında "Yeni bildiriminiz yok" mesajının gösterilmesi.
  - İstek kabul veya red edildiğinde o satırın listeden kaybolması.
  - Bekleyen sayısının rozet üzerinde eşzamanlı güncellenmesi.
- **Teknik Detaylar:**
  - Yeni istekleri yakalamak için periyodik veri çekme (Polling) veya WebSockets entegrasyonu.
  - Bildirim menüsü açıldığında `useEffect` veya `onMounted` hook'ları ile verilerin taze olarak getirilmesi.
  - Liste render işlemlerinde (Map function) unique `key` proplarının kullanımı.
