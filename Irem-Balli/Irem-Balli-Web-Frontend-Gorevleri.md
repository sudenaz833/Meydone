# Meydone'ın Web Frontend Görevleri (İrem BALLI)

**Web Frontend Adresi:** [frontend.meydone.com](https://meydone.vercel.app)

**Front-end Test Videosu:**  https://youtu.be/PsKdcnXPhqA

1. Arkadaşlık İsteği Onaylama Sayfası
API Endpoint: PUT /api/friends/accept/{id}

UI Bileşenleri:

"Gelen İstekler" sekmesi altında kullanıcı kartları.

İsteği kabul etmek için "Onayla" butonu.

İşlem sürerken buton üzerinde Loading Spinner.

Validasyon & Kontrol:

requestId parametresinin geçerli bir ID olduğunun kontrolü.

Sadece beklemedeki (pending) isteklerin listede gösterilmesi.

Kullanıcı Deneyimi:

Onaylama sonrası kartın listeden kaybolması veya "Arkadaş Oldunuz" yazısına dönüşmesi.

Başarılı işlem sonrası yeşil renkli "Arkadaşlık isteği kabul edildi" bildirimi (Toast).

Teknik Detaylar:

Bearer Token'ın Header'a otomatik eklenmesi.

Global arkadaşlık state'inin (Redux/Context) anlık güncellenmesi.

2. Arkadaş Listesinden Silme Akışı
API Endpoint: DELETE /api/friends/{id}

UI Bileşenleri:

Arkadaş listesindeki her profilin yanında "Arkadaşı Sil" veya "X" butonu.

Silme işlemi öncesi "Bu kişiyi arkadaşlıktan çıkarmak istediğinize emin misiniz?" onay modalı.

Kullanıcı Deneyimi:

Silme onaylandığında profilin listeden yumuşak bir animasyonla kaldırılması.

Hatalı bir durumda (404 vb.) kullanıcıya uyarı verilmesi.

Teknik Detaylar:

204 No Content yanıtı sonrası arayüzden ilgili elementin ayıklanması (Filter method).

3. Arkadaş Listesini Görüntüleme Sayfası
API Endpoint: GET /api/friends

UI Bileşenleri:

Arkadaşların listelendiği Grid veya List yapısı.

Arkadaş sayısı sayacı (Badge).

Profil fotoğrafları için Avatar bileşeni.

Kullanıcı Deneyimi:

Liste boşsa "Henüz kimseyle arkadaş değilsiniz" şeklinde Empty State tasarımı.

Sayfa yüklenirken Skeleton Screen gösterimi.

Teknik Detaylar:

Verilerin useEffect hook'u ile sayfa açılışında çekilmesi.

friends array'inin map fonksiyonu ile render edilmesi.

4. Yakındaki Mekanları Listeleme (Konum Servisi)
API Endpoint: GET /api/venues/nearby

UI Bileşenleri:

"Yakınımdakiler" sekmesi.

Mekan kartlarında mesafe bilgisi (Örn: 5.2 km).

Yarıçap seçimi için Slider veya Dropdown (5km, 10km, 20km).

Validasyon & Kontrol:

Tarayıcı konum izni verilmemişse "Konum izni gerekli" uyarısı.

Kullanıcı Deneyimi:

Mekanların en yakından en uzağa doğru otomatik sıralanması.

Teknik Detaylar:

navigator.geolocation üzerinden alınan lat/lng verilerinin Query String olarak iletilmesi.

5. Mekanları Harita Üzerinde Gösterme
API Endpoint: GET /api/venues/map

UI Bileşenleri:

Tam ekran veya modal içinde interaktif harita (Google Maps/Leaflet).

Mekan konumları için özel Marker'lar.

Marker tıklandığında açılan bilgi penceresi (Popup).

Kullanıcı Deneyimi:

Harita üzerinde mekana tıklandığında detay sayfasına yönlendirme linki.

Teknik Detaylar:

API'den gelen koordinat array'inin harita kütüphanesi ile senkronize render edilmesi.

6. Gizlilik Ayarları Güncelleme Sayfası
API Endpoint: POST /api/users/profile/privacy

UI Bileşenleri:

"Konum Görünürlüğü" ve "Paylaşım Görünürlüğü" için Switch/Toggle butonları.

"Herkes" veya "Sadece Arkadaşlar" seçenekleri.

"Değişiklikleri Kaydet" butonu.

Kullanıcı Deneyimi:

Başarılı kayıt sonrası "Gizlilik ayarlarınız güncellendi" Toast mesajı.

Teknik Detaylar:

Mevcut ayarların profil bilgisinden çekilip Toggle'ların başlangıç değerlerine atanması.

7. Yorum Beğenme Mikro-Etkileşimi
API Endpoint: POST /api/comments/{id}/like

UI Bileşenleri:

Yorumların altında Kalp veya Beğeni ikonu.

Beğeni sayısı göstergesi.

Kullanıcı Deneyimi:

Tıklandığında ikonun dolgu renginin değişmesi.

Beğeni sayısının anlık olarak artması/azalması (Toggle).

Teknik Detaylar:

Optimistic UI: İstek sonucu beklenmeden sayının artırılması, hata gelirse geri alınması.

8. Admin: Mekana Görsel Yükleme Paneli
API Endpoint: POST /api/admin/venues/{id}/photo

UI Bileşenleri:

Admin panelinde mekana özel "Fotoğraf Yükle" alanı.

Dosya seçici (File Input).

Seçilen fotoğrafın önizlemesi (Preview).

Validasyon:

Sadece resim dosyası seçilebilmesi (accept="image/*").

Kullanıcı Deneyimi:

Yükleme esnasında ilerleme çubuğu (Progress Bar).

Teknik Detaylar:

FormData kullanımı ve multipart/form-data header yapılandırması.
