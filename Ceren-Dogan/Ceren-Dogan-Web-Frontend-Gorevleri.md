# Meydone'ın Web Frontend Görevleri

**Web Frontend Adresi:** [frontend.meydone.com](https://meydone.vercel.app)

**Front-end Test Videosu:** [Frontend test videosu](https://www.youtube.com/watch?v=pahIbhEaXWU)
## 1.Kullanıcı Üye Olma (Kayıt) Sayfası
- **API Endpoint:** `POST /auth/register`
- **Görev:** Kullanıcı kayıt işlemi için web sayfası tasarımı ve implementasyonu
- **UI Bileşenleri:**
  - Responsive kayıt formu (desktop ve mobile uyumlu)
  - Radio button ile Kullanıcı tipi seçenekleri: “Kullanıcı” “Mekan Sahibi”Kullanıcı seçimine göre form alanları değişebilir.
  - Ad (name) input alanı (autocomplete="given-name",placeholder="Ad")
  - Soyad (surname) input alanı (autocomplete="family-name",placeholder="Soyad")
  - Email input alanı (type="email", autocomplete="email", pattern=".+@gmail\.com$", placeholder="E-posta")
  - Şifre input alanı (type="password",placeholder="Şifre",en az 8 karakter)
  - Şifreyi göster/gizle seçeneği ->Checkbox ile toggle yapılır
  - Kullanıcı adı (username) input alanı(type="text", autocomplete="username", placeholder="Kullanıcı adı")
  - Doğum tarihi seçimi (type="date") 
  - "Kayıt Ol" butonu (primary button style)
  - "Zaten hesabınız var mı? Giriş Yap" linki
  - Loading spinner (kayıt işlemi sırasında)
  - Form container (card veya centered layout)
- **Form Validasyonu:**
  - HTML5 form validation (required, pattern attributes)
  - JavaScript real-time validation
  - Email format kontrolü (regex pattern)
  - Şifre güvenlik kuralları (min 8 karakter)
  - Alanlar boş bırakılamaz kontrolü
  - Tüm alanlar geçerli olmadan buton disabled
  - Client-side ve server-side validation
- **Kullanıcı Deneyimi:**
  - Form hatalarını input altında gösterilmesi (inline validation)
  - Başarılı kayıt sonrası success notification ve otomatik giriş sayfasına yönlendirme
  - Hata durumlarında kullanıcı dostu mesajlar (409 Conflict: "Bu email zaten kullanılıyor")
  - Hata durumlarında kullanıcı dostu mesajlar (400 Bad Request: "Geçerli email girin.gmail uzantılı")
  - Hata durumlarında kullanıcı dostu mesajlar (409 Conflict: "Bu kullanıcı adı zaten kullanılıyor")
  - Hata durumlarında kullanıcı dostu mesajlar (400 Bad Request: "Bu doğum tarihi gelecekte ")
  - Hata durumlarında kullanıcı dostu mesajlar (400 Bad Request: "ad soyad harf içermelidir")
  - Form submission prevention (double-click koruması)
  - Accessible form labels ve ARIA attributes
  - Keyboard navigation desteği (Tab, Enter) yok
- **Teknik Detaylar:**
  - Framework: React/Vue/Angular veya Vanilla JS
  - Form library: React Hook Form, Formik, veya native HTML5
  - State management (form state, loading state, error state)
  - Routing (kayıt sayfasından giriş sayfasına geçiş)
  - SEO optimization (meta tags, structured data)
  - Accessibility (WCAG 2.1 AA compliance)

## 2. Giriş (Login) Sayfası

- **API Endpoint:** `POST /auth/login`
- **Görev:** JWT ile oturum açma sayfası tasarımı ve implementasyonu.
- **UI Bileşenleri:**
  - Email input (`type="email"`, `autocomplete="username"` veya `email`,`placeholder="E-posta veya kullanıcı adı"`)
  - Şifre input (`type="password"`, `autocomplete="current-password"`,`placeholder="Şifre"`)
  - “Giriş Yap” butonu (primary)
  - "Hesabınız yok mu? Üye olun" linki
  - Şifre gizliliği
  - Loading spinner
  - Form container (card veya centered layout)
- **Form Validasyonu:**
  - HTML5 required; email formatı
  - Hata durumlarında kullanıcı dostu mesajlar (401 Unauthorized: "E-posta/kullanıcı adı veya şifre hatalı.")
  - `401` için kullanıcı dostu mesaj
- **Kullanıcı Deneyimi:**
  - Inline hatalar; başarıda token saklama ve korumalı alana yönlendirme
  - Accessible labels, ARIA, Tab/Enter yok
- **Teknik Detaylar:**
  - Axios interceptor ile Bearer; React Context veya eşdeğeri
  - SEO (login sayfası meta)

---
## 3. Yorum Yapma ve 4.Yoruma Fotoğraf ekleme 

- **API Endpoint:** `POST /comments` ve `POST /comments/{id}/photo`
- **Görev:** Kullanıcıların yorum yazmasını sağlayacak bir arayüz tasarlamak ve uygulamak.Kullanıcılar yorum metni girebilecek ve isteğe bağlı olarak fotoğraf ekleyebilecek
- **UI Bileşenleri:**
  - Başlık: "Yorumlar"
  - İçerik Durumu: Henüz yorum yok → "Henüz yorum yok" mesajı gösterilir.Yorum yapılınca değişir bu yazı.(örn:1 yorum)
  - Textarea alanı (`placeholder: "Deneyiminizi paylaşın..."`)Kullanıcı yorum yazabilir
  - "Yorumu Gönder" butonu.Tıklanınca yorum listeye eklenir
  - Form submission prevention (double-click koruması)
  - "Fotoğraf Ekle" butonu
  - Kullanıcı yorumuna fotoğraf ekleyebilir(opsiyonel).Desteklenen formatlar: JPG, PNG, GIF
  - Maksimum boyut: 5MB (opsiyonel)
  - Gönderilen yorumlar başlık altında listelenir.
  - Her yorumda: kullanıcı adı, tarih, yorum metni, varsa fotoğraf
  - Yorum Sonrası Textarea alanı açılır.Yapılan yoruma başka kullanıcı yorum yapabilir
- **Validasyon ve Kullanıcı Deneyimi:**
  - Fotoğraf yüklenmezse de yorum gönderilebilir
  - Hata mesajı döner."Yorum boş olamaz" → 400 Bad Request .Lütfen bu alanı doldurunuz.
- **Teknik Detaylar:**
  - Accessible form labels ve ARIA attributes
  - Keyboard navigation destekli (Tab, Enter) yok.
  - Responsive tasarım (desktop ve mobile uyumlu)
---
## 5.Yorum Güncelleme ve 6.Yorum Silme 

- **API Endpoint:** `PUT /comments/{id}` ve `DELETE /comments/{id}`
- **Görev:** Kullanıcılar kendi yorumlarını güncelleyebilir veya silebilir.
- **UI Bileşenleri:**
  - Her yorumun yanında beğenme sayısı gösterilir.Kullanıcı tıklayınca sayısı artar veya azalır (toggle)Sayı gerçek zamanlı güncellenir
  - Yorumu Düzenle Butonu:Kullanıcı kendi yorumunu düzenleyebilir.Düzenleme sırasında:Metindeğiştirilebilir,
  Fotoğraf ekleyebilir veya mevcut fotoğrafı değiştirebilir.Düzenleme tamamlandığında yorum listeye güncel haliyle yansır
  -Yorumu Sil (Delete) Butonu:Kullanıcı kendi yorumunu kalıcı olarak silebilir.Silme işlemi geri alınamaz
- **Validasyon ve Kullanıcı Deneyimi:**
  - Düzenleme sırasında yorum boş bırakılamaz → 400 Bad Request: "Yorum boş olamaz"
  - Fotoğraf boyutu çok büyük → 400 Bad Request: "Fotoğraf boyutu çok büyük"
  - Desteklenmeyen dosya formatı → 400 Bad Request: "Desteklenmeyen dosya formatı"
  - Kullanıcı yalnızca kendi yorumlarını düzenleyebilir veya silebilir
  - Başka kullanıcıların yorumlarına müdahale edilemez
  - Yorumunu kalıcı siler
- **Teknik Detaylar:**
  - Accessible form labels ve ARIA attributes
  - Keyboard navigation destekli (Tab, Enter) yok.
  - Responsive tasarım (desktop ve mobile uyumlu)
---
## 7.Yoruma Gelen Beğeni Bildirimi

- **API Endpoint:** `GET /notifications/comment-likes` 
- **Görev:** Kullanıcıların yorumları başka kullanıcılar tarafından beğenildiğinde bildirim almasını sağlayacak bir sistem tasarlamak ve uygulamak
- **UI Bileşenleri:**
  - Bildirim Gönderimi:Yorum yapan kullanıcı, anasayfasındaki zil ikonunda kırmızı bir sayı görür
  - 1, 2… şeklinde yeni bildirim sayısı
  - Kullanıcı bildirime tıkladığında bildirim listesi açılır
  - Bildirim İçeriği:“[Yorumu beğenen kullanıcı adı], yorumunuzu beğendi”.Hangi yorumun beğenildiği belirtilir
  - Yorumun kendisi de küçük önizleme olarak gösterilebilir
- **Bildirim Detayları ve UX:**
  - Her beğenme için ayrı bir bildirim oluşturulur
  - Kullanıcı bildirimleri okundu olarak işaretleyebilir
  - Zil ikonu kırmızı sayı → okunmamış bildirim sayısını gösterir
  - Responsive tasarım (desktop ve mobile uyumlu)
  - Accessible: ARIA attributes ile screen reader desteği
- **Kullanıcı Deneyeimi:**
  - Yeni bildirimler kullanıcıyı anında bilgilendirir, beklemek gerekmez
  - Okunmamış bildirim sayısı görsel olarak öne çıkar, dikkat çeker
- **Backend / Teknik Notlar:**
  - Her beğenme işlemi → notification tablosuna kayıt
  - Kullanıcı anasayfası → real-time veya sayfa yenileme ile bildirimleri çekebilir
  - Bildirimler sadece ilgili kullanıcıya gösterilir (başkaları göremez)
---
## 8.İsimle Mekan Arama ve 9.Kategoriye Göre Mekan Filtreleme

- **API Endpoint:** `GET /venues/search` ve `GET /venues/filter`
- **Görev:**  Kullanıcıların sistemde kayıtlı olan mekanları adlarına göre arayabilmesini sağlar. Kullanıcı arama çubuğuna bir mekan ismi veya ismin bir kısmını yazdığında, sistem girilen ifadeye uygun eşleşmeleri veritabanında sorgular ve sonuçları liste halinde kullanıcıya sunar.
- **Görev:**  Kullanıcıların uygulama içerisinde kayıtlı mekanları belirli kategori kriterlerine göre filtreleyebilmesini sağlamalıdır. Kullanıcıların ihtiyaç duydukları mekan türüne hızlı, kolay ve doğru bir şekilde ulaşmalarını sağlar.
- **UI Bileşenleri:**
  - Arama çubuğu alanı(type="text", placeholder"Mekan adı veya menüde ara...")
  - Yazılan ifadeye uygun eşleşmeler veritabanında sorgulanır
  - Sonuçlar alt alta liste halinde gösterilir
  - Kullanıcı listedeki mekana tıkladığında ilgili sayfaya yönlendirilir
  - Arama çubuğunun yanında Tüm Kategoriler butonu ve Dropdown menü(tatlı,hazıryemek,kafe) 
  - Tıklayınca kategoriler alt alta sıralanma
- **UX ve Erişilebilirlik:**
  - Responsive tasarım (desktop ve mobile uyumlu)
  - Keyboard navigation destekli (Tab, Enter) yok
  - Dropdown veya filtre listesi erişilebilir olmalı
  - Gerçek zamanlı arama ve filtreleme opsiyonel (arama sırasında sonuçlar anında gösterilebilir)
- **Kullanıcı Deneyeimi:**
  - Anında Geri Bildirim: Arama sırasında sonuçlar gerçek zamanlı gösterilir, kullanıcı beklemek zorunda kalmaz
  - Kolay Erişim: Kategori filtresi ve arama çubuğu birlikte çalışır, kullanıcı istediği mekana hızlıca ulaşır
  - Placeholder ve İpuçları: Arama çubuğunda “Mekan ara...” gibi yönlendirici yazılar, kullanıcıya ne yapacağını gösterir
---