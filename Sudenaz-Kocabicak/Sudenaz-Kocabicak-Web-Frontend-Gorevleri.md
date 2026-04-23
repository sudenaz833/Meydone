# Meydone'ın Web Frontend Görevleri (Sudenaz Kocabıçak)

**Web Frontend Adresi:** [frontend.meydone.com](https://meydone.vercel.app)

**Front-end Test Videosu:** [https://youtu.be/KZE3i1Vcp5A]


## 1. Mekan Sahibi Mekan Silme

- **API Endpoint:** `DELETE /admin/venues/{venuesId}`
- **UI Bileşenleri:**
  - Mekan yönetim panelinde veya ayarlar sayfasında kırmızı renkli "Mekanı Sil" butonu.
  - Tıklandığında açılan Onay Penceresi (Confirmation Modal).
  - Güvenlik amaçlı şifre doğrulama input alanı.
  - İşlem sırasında gösterilecek Loading Spinner.
- **Form Validasyonu:**
  - Onay penceresinde kullanıcının mevcut şifresini girmesinin zorunlu tutulması.
  - Yanlışlıkla silmeyi önlemek için input içine "SİL" kelimesinin yazılmasının istenmesi.
- **Kullanıcı Deneyimi:**
  - Tehlikeli bir işlem olduğu için butonun UI üzerinde belirgin (Danger/Kırmızı) tasarlanması.
  - İşlem başarılı olduğunda "Mekanınız başarıyla silindi" bildirimi (Toast) ve anasayfaya/giriş ekranına otomatik yönlendirme.
- **Teknik Detaylar:**
  - İstek başlığına (Header) yetkili mekan sahibinin JWT Token'ının eklenmesi.
  - İşlem başarılı olduğunda global state (Context/Redux) üzerindeki kullanıcı ve mekan verilerinin temizlenmesi.

## 2. Mekan Sahibi Üye Olma

- **API Endpoint:** `POST /admin/register`
- **UI Bileşenleri:**
  - Ad, soyad, email ve şifre input alanları.
  - Mekan adı ve konum bilgisi (Adres veya Harita üzerinden seçme) alanları.
  - Açılış-kapanış saatleri için TimePicker bileşenleri.
  - Menü içeriği eklemek için dinamik liste (Input + Ekle butonu).
  - Mekan fotoğrafları için Sürükle-Bırak (Drag & Drop) dosya yükleme alanı.
- **Form Validasyonu:**
  - Email format kontrolü ve güçlü şifre kuralları (min. 8 karakter, harf/sayı).
  - Dosya yükleme alanında sadece görsellerin (`.jpg, .png`) ve belirli bir boyutun (örn: 5MB) altındaki dosyaların kabul edilmesi.
  - Zorunlu alanların (Ad, Soyad, Mekan Adı vb.) boş bırakılamaması.
- **Kullanıcı Deneyimi:**
  - Form çok uzun olacağı için "Adım Adım" (Multi-step Wizard) form yapısının kullanılması.
  - Yüklenen fotoğrafların anında küçük önizlemelerinin (Thumbnail) gösterilmesi.
  - Başarılı kayıt sonrası yönetim paneline yönlendirme.
- **Teknik Detaylar:**
  - Fotoğraf ve veri gönderimi için isteğin `multipart/form-data` formatında yapılması (FormData objesi kullanımı).
  - Form state yönetimi için `React Hook Form` veya `Formik` kullanımı.

## 3. Puan Verme

- **API Endpoint:** `POST /venues/{id}/rate`
- **UI Bileşenleri:**
  - Mekan detay sayfasında 5 yıldızlı interaktif değerlendirme bileşeni (Rating Stars).
  - İşlemi onaylamak için "Puanla" butonu veya yıldızlara tıklandığında anında aksiyon alma.
- **Form Validasyonu:**
  - Puanın 1 ile 5 arasında bir değer olduğunun kontrolü.
  - Kullanıcının oturum açıp açmadığının kontrol edilmesi.
- **Kullanıcı Deneyimi:**
  - Fare ile yıldızların üzerine gelindiğinde (Hover) yıldızların dolması (Görsel geri bildirim).
  - Başarılı puanlama sonrası "Değerlendirmeniz kaydedildi" yazan yeşil bir Snackbar/Toast gösterimi.
- **Teknik Detaylar:**
  - Optimistic UI yaklaşımı ile sunucu yanıtını beklemeden arayüzdeki yıldızların dolu hale getirilmesi.
  - Kullanıcı oturum açmamışsa işlem engellenip Login sayfasına yönlendirilmesi.

## 4. Ortalama Puan Hesaplama

- **API Endpoint:** `GET /venues/{id}/average-rating`
- **UI Bileşenleri:**
  - Mekan listeleme kartlarında ve mekan detay sayfasında ortalama puanı gösteren sarı yıldız ikonu.
  - Yıldızın yanında sayısal değer (Örn: 4.2) ve toplam değerlendirme sayısı (Örn: 145 değerlendirme).
- **Form Validasyonu:**
  - Kullanıcıdan veri alınmadığı için form validasyonu bulunmamaktadır (Sadece okuma işlemi).
- **Kullanıcı Deneyimi:**
  - Sayfa ilk açıldığında puan verisi yüklenene kadar gri bir Skeleton/Placeholder gösterimi.
  - Mekan hiç puan almamışsa "Henüz değerlendirilmedi" şeklinde bilgilendirici bir metin sunulması.
- **Teknik Detaylar:**
  - Component mount olduğunda (`useEffect` hook) verinin çekilmesi.
  - Çekilen küsuratlı değerlerin arayüzde ondalık formata (örn: 4.25 yerine 4.3) yuvarlanarak gösterilmesi.

## 5. Puana Göre Sıralama

- **API Endpoint:** `GET /venues/sort?by=rating`
- **UI Bileşenleri:**
  - Mekan listesi sayfasının üst kısmında "Sırala" Dropdown (Açılır Menü) veya Select bileşeni.
  - Seçenekler: "Puana Göre Azalan (En Yüksek)", "Puana Göre Artan (En Düşük)".
- **Form Validasyonu:**
  - Arama veya filtreleme parametrelerinin API'nin beklediği formatta olduğunun kontrolü.
- **Kullanıcı Deneyimi:**
  - Kullanıcı sıralama seçeneğini değiştirdiği anda listenin sayfayı yenilemeden güncellenmesi.
  - Yenilenme esnasında eski listeyi hafif saydam (opacity) yapıp üzerine loader gösterilmesi.
- **Teknik Detaylar:**
  - Seçilen sıralama kriterinin URL Query parametrelerine (Örn: `?sort=rating&order=desc`) yansıtılması (URL tabanlı state yönetimi).
  - İsteğin Axios ile yapılıp gelen yeni dizinin mekanlar state'ine aktarılması.

## 6. Kullanıcı Hesap Silme

- **API Endpoint:** `DELETE /users/account`
- **UI Bileşenleri:**
  - Profil/Hesap ayarları sayfasının en altında yer alan "Hesabımı Sil" butonu.
  - Silme onayı isteyen tehlike modalı (Danger Modal).
- **Form Validasyonu:**
  - Hesabın yanlışlıkla silinmesini engellemek için, kullanıcının hesap şifresini doğrulaması.
- **Kullanıcı Deneyimi:**
  - Silme kararından vazgeçebilmesi için "İptal" butonunun daha vurgulu (Primary), silme butonunun ise tehlike renginde (Danger) tasarlanması.
  - İşlem başarılı olduğunda anasayfaya yönlendirilip oturumun sonlandığını belirten mesaj gösterimi.
- **Teknik Detaylar:**
  - Başarılı silme işlemi sonrası LocalStorage/SessionStorage içerisindeki JWT Token'ın temizlenmesi.
  - Authorization Header kullanılarak güvenli isteğin atılması.

## 7. Kullanıcı Profil Güncelleme

- **API Endpoint:** `PUT /users/profile`
- **UI Bileşenleri:**
  - Ad, Soyad ve Telefon numarası gibi kişisel verilerin yer aldığı input alanları.
  - Profil fotoğrafını değiştirmek için görselin üzerine tıklandığında açılan dosya seçici (File Uploader).
  - "Değişiklikleri Kaydet" butonu.
- **Form Validasyonu:**
  - Telefon numarasının belirli bir formata (Regex) uygunluğunun kontrolü.
  - Yüklenen profil fotoğrafının boyut (Örn: max 2MB) ve format kontrolü.
- **Kullanıcı Deneyimi:**
  - Sayfa açıldığında input alanlarının kullanıcının mevcut bilgileriyle dolu (Default value) gelmesi.
  - Yeni bir profil fotoğrafı seçildiğinde, form kaydedilmeden önce arayüzde önizlemesinin (Preview) gösterilmesi.
- **Teknik Detaylar:**
  - Resim dosyası içerdiği için `multipart/form-data` ile gönderim yapılması.
  - Değişiklik kaydedildikten sonra Header/Navbar gibi alanlardaki küçük profil fotoğrafının global state üzerinden güncellenmesi.

## 8. Profile Gönderi Ekleme

- **API Endpoint:** `POST /users/posts`
- **UI Bileşenleri:**
  - Profil sayfasında gönderi metni için Textarea bileşeni.
  - Fotoğraf eklemek için görsel ikonu (Image Upload button).
  - "Paylaş" butonu.
- **Form Validasyonu:**
  - Textarea veya görselden en az birinin dolu olması zorunluluğu (Boş gönderi paylaşılamaz).
  - Metin içeriği için maksimum karakter sınırı kontrolü.
- **Kullanıcı Deneyimi:**
  - Resim eklendiğinde formun altında küçük bir önizleme ve resmi formdan çıkarma (X) butonu gösterimi.
  - Gönderi paylaşılırken butonun "Paylaşılıyor..." şeklini alıp deaktif (disabled) olması.
  - Paylaşım başarılı olunca yeni gönderinin arayüzdeki listeye en üstten (animasyonlu şekilde) eklenmesi.
- **Teknik Detaylar:**
  - Gönderi yüklenmesi sonrası API'den dönen yeni gönderi objesinin (Post Object), mevcut listeyi tutan state dizisinin en başına (`[newPost, ...posts]`) eklenmesi.
  - İstek atılırken oluşan hataların Catch bloğunda yakalanıp arayüzde uygun hata mesajıyla gösterilmesi.
