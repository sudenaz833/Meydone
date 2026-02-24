# Gereksinim Analizi

# Tüm Gereksinimler 

1. **Giriş Yapma** (Ceren Doğan)
   - **API Metodu:** `POST /auth/login`
   - **Açıklama:** Kullanıcıların ve mekan sahibinin sisteme giriş yaparak hizmetlere erişmesini sağlar. Email adresi ve şifre ile kimlik doğrulama yapılır. Başarılı giriş sonrası kullanıcıya ve mekan sahibine erişim izni verilir ve kişisel verilerin güvenliği sağlanır.

2. **Kullanıcı Üye Olma** (Ceren Doğan)
    - **API Metodu:** `POST /auth/register`
    - **Açıklama:** Kullanıcıların yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Kişisel bilgilerin toplanmasını (ad,soyad,doğum tarihi) ve hesap oluşturma işlemlerini içerir. Kullanıcılar email adresi,kullanıcı adı ve şifre belirleyerek hesap oluşturur.
     
3. **Yorum Yapma** (Ceren Doğan)
    - **API Metodu:** `POST /comments`
    - **Açıklama:** Kullanıcıların restoranlar hakkında deneyimlerini, puanlarını ve görüşlerini paylaşabilmesini sağlamak.
Bu özellik sayesinde uygulama, kullanıcı deneyimine dayalı dinamik bir içerik yapısına sahip olur.

4. **Yoruma Fotoğraf Ekleme** (Ceren Doğan)
    - **API Metodu:** `POST /comments/{id}/photo`
    - **Açıklama:** Kullanıcının mekan hakkında yaptığı yorumu görsel ile desteklemesini sağlar. Bu özellik sayesinde kullanıcılar deneyimlerini daha gerçekçi ve görsel destekli şekilde paylaşabilirler. Uygulamanın güvenilirliği ve etkileşimi artar.
   
5. **Yorum Silme** (Ceren Doğan)
    - **API Metodu:** `DELETE /comments/{id}`
    - **Açıklama:** Kullanıcıların, sisteme daha önce ekledikleri yorumları silebilmesini sağlamak. Bu özellik sayesinde kullanıcı hatalı, eski veya uygunsuz içerikleri sistemden kaldırabilir.
   
6. **Yorum Güncelleme** (Ceren Doğan)
   - **API Metodu:** `PUT /comments/{id}`
   - **Açıklama:** Kullanıcıların daha önce yaptıkları yorumları güncelleyebilmesini sağlamak.Bu özellik sayesinde kullanıcılar
   yazım hatalarını düzeltebilir, puanlarını değiştirebilir veya deneyimleri değiştiyse yorumlarını güncelleyebilir.

7. **İsimle Mekan Arama** (Ceren Doğan)
   - **API Metodu:**`GET /venues/search?name=`
   - **Açıklama:** Kullanıcıların sistemde kayıtlı olan mekanları adlarına göre arayabilmesini sağlar. Kullanıcı arama çubuğuna bir mekan ismi veya ismin bir kısmını yazdığında, sistem girilen ifadeye uygun eşleşmeleri veritabanında sorgular ve sonuçları liste halinde kullanıcıya sunar.

8. **Kategoriye Göre Mekan Filtreleme** (Ceren Doğan)
   - **API Metodu:** `GET /venues/filter?category=`
   - **Açıklama:** Kullanıcıların uygulama içerisinde kayıtlı mekanları belirli kategori kriterlerine göre filtreleyebilmesini sağlamalıdır. Kullanıcıların ihtiyaç duydukları mekan türüne hızlı, kolay ve doğru bir şekilde ulaşmalarını sağlar.

9. **Yoruma Gelen Beğeni Bildirimi** (Ceren Doğan)
   - **API Metodu:** `GET /notifications/comment-likes`
   - **Açıklama:** Sistem, kullanıcıların yaptıkları yorumlara başka kullanıcılar tarafından beğeni (like) bırakılması durumunda, ilgili kullanıcıya bildirim gönderilir.

10. **Mekan Sahibi Mekan Silme** (Sudenaz Kocabıçak)
    - **API Metodu:** `DELETE /admin/venues/{venuesId}`
    - **Açıklama:** Sistem, mekan sahiplerinin kendilerine ait işletme kayıtlarını sistemden silebilmesini sağlamalıdır. Silme işlemi yalnızca ilgili mekanın sahibi tarafından gerçekleştirilebilmelidir.
 
11. **Mekan Sahibi Üye Olma** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /admin/register`
    - **Açıklama:** Mekan sahipleri yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Adı, soyadı, konumu, açılış kapanış saatleri,menü içeriği ve ilgili fotoğraf yükleme bilgilerinin toplanmasını ve hesap oluşturma işlemlerini içerir.Mekan sahibi email adresi ve şifre belirleyerek hesap oluşturur.

12. **Puan Verme** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /venues/{id}/rate`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların ziyaret ettikleri mekanlara belirli bir puan aralığında (örneğin 1–5 yıldız) değerlendirme yapabilmesini sağlamalıdır. Kullanıcıların deneyimlerini sayısal olarak ifade edebilmesini sağlamak ve diğer kullanıcıların mekan hakkında hızlı bir kalite değerlendirmesi yapabilmesine olanak tanımaktır.

13. **Ortalama Puan Hesaplama** (Sudenaz Kocabıçak)
    - **API Metodu:** `GET /venues/{id}/average-rating`
    - **Açıklama:** Sistem, kullanıcılar tarafından bir mekana verilen tüm puanları dikkate alarak ilgili mekanın ortalama puanını otomatik olarak hesaplamalı ve güncel değeri kullanıcı arayüzünde göstermelidir. 
   
14. **Puana Göre Sıralama** (Sudenaz Kocabıçak)
    - **API Metodu:** `GET /venues/sort?by=rating`
    - **Açıklama:** Sistem, kullanıcıların mekanın ortalama puan değerlerine göre sıralayabilmesini sağlamalıdır. Kullanıcı, listeleme ekranında mekanı yüksek puandan düşüğe (azalan) veya düşük puandan yükseğe (artan) olacak şekilde sıralayabilmelidir.

15. **Kullanıcı Hesap Silme** (Sudenaz Kocabıçak)
    - **API Metodu:** `DELETE /auth/account`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların kendi hesaplarını kalıcı olarak silebilmesine olanak sağlamalıdır. Hesap silme işlemi, kullanıcının kimlik doğrulaması yapmasının ardından gerçekleştirilmelidir.

16. **Kullanıcı Profil Güncelleme** (Sudenaz Kocabıçak)
    - **API Metodu:** `PUT /auth/profile`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların kendi profil bilgilerini güncelleyebilmesini sağlamalıdır. Kullanıcı; ad-soyad, profil fotoğrafı, telefon numarası, şifre ve benzeri kişisel bilgilerini düzenleyebilmelidir.

17. **Profile Gönderi Ekleme** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /auth/posts`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların kendi profilleri üzerinden gönderi (post) paylaşabilmesini sağlamalıdır. Kullanıcı, metin içeriği ve isteğe bağlı olarak görsel ekleyerek profilinde paylaşım yapabilmelidir.

18. **Arkadaşlık İsteği Onay** (İrem Ballı)
	- **API Metodu:** `PUT /friends/accept/{id}`
	- **Açıklama:** Sistem, kullanıcıların kendilerine gönderilen arkadaşlık isteklerini görüntüleyebilmesini ve bu istekleri kabul veya reddedebilmesini sağlamalıdır.

19. **Arkadaş Listesinden Silme** (İrem Ballı)
    - **API Metodu:** `DELETE /friends/{id}`
    - **Açıklama:** Sistem, kullanıcıların mevcut arkadaşlık ilişkilerini sonlandırabilmesini sağlamalıdır. Silme işlemi sonrasında iki kullanıcı arasındaki bağlantı sistemden kaldırılmalıdır.

20. **Arkadaş Listesini Görüntüleme** (İrem Ballı)
    - **API Metodu:** `GET /friends`
    - **Açıklama:** Sistem, kullanıcının arkadaş listesini görüntüleyebilmesini sağlamalıdır. Listede arkadaşlara ait temel profil bilgileri (ad, profil fotoğrafı, kullanıcı adı vb.) yer almalıdır.

21. **Konuma Göre Yakın Mekanları Listeleme** (İrem Ballı)
    - **API Metodu:** `GET /venues/nearby?lat={lat}&lng={lng}`
    - **Açıklama:** Sistem, kullanıcının konum bilgisine göre belirlenen mesafe aralığındaki mekanları listeleyebilmelidir. Mekanlar, kullanıcıya olan uzaklık bilgisi ile birlikte sunulmalıdır.

22. **Mekanları Harita Üzerinde Gösterme** (İrem Ballı)
   - **API Metodu:** `GET /venues/map`
   - **Açıklama:** Sistem, kayıtlı mekanların konum bilgilerini harita arayüzünde işaretleyerek kullanıcıların mekânsal olarak görüntüleyebilmesini sağlamalıdır. Her mekan için enlem ve boylam bilgisi sağlanmalıdır.           

23. **Konum ve Paylaşım Gizlilik Ayarı** (İrem Ballı)
   - **API Metodu:** `POST /auth/privacy`
   - **Açıklama:** Sistem, kullanıcıların konum bilgilerini ve paylaştıkları içerikleri kimlerin görebileceğini belirleyebilecekleri gizlilik ayarları sunmalıdır. Kullanıcı, profil ayarları üzerinden görünürlük seviyesini yönetebilmelidir.

24. **Yorum Beğenme** (İrem Ballı)
   - **API Metodu:** `POST /comments/{id}/like`
   - **Açıklama:** Sistem, kullanıcıların diğer kullanıcılar tarafından yapılan yorumları beğenebilmesini sağlamalıdır. Beğeni işlemi, yorumun faydalı veya olumlu bulunduğunu göstermek amacıyla yapılır ve yorum üzerinde beğeni sayısı olarak görüntülenir.

25. **Admin Profiline Mekan için Gönderi Ekleme** (İrem Ballı)
   - **API Metodu:** `POST /admin/venues/{id}/photo`
   - **Açıklama:** Sistem, yetkili yöneticilerin belirli bir mekana fotoğraf yükleyebilmesini sağlamalıdır. Yüklenen görseller ilgili mekanın detay sayfasında görüntülenmelidir.

26. **Saat Güncelleme** (Ayşe Küçük)
   - **API Metodu:** `PUT /admin/venues/{id}/hours`
   - **Açıklama:** Sistem, yetkili yöneticinin ilgili mekana ait çalışma saatlerini güncelleyebilmesini sağlamalıdır. Güncellenen bilgiler kullanıcı arayüzünde anlık ve doğru şekilde görüntülenmelidir.

27. **Konum Güncelleme** (Ayşe Küçük)
   - **API Metodu:** `PUT /admin/venues/{id}/location`
   - **Açıklama:** Sistem, yetkili yöneticinin mekana ait coğrafi konum bilgilerini (enlem ve boylam) güncelleyebilmesini sağlamalıdır. Güncellenen konum bilgisi harita üzerinde doğru şekilde yansıtılmalıdır.

28. **Menü Güncelleme** (Ayşe Küçük)
   - **API Metodu:** `PUT /admin/venues/{id}/menu`
   - **Açıklama:** Sistem, yetkili yöneticinin mekana ait menü içeriklerini güncelleyebilmesini sağlamalıdır. Yapılan değişiklikler kullanıcılar tarafından görüntülenebilir olmalıdır.

29. **Şifre Sıfırlama** (Ayşe Küçük)
   - **API Metodu: POST /auth/forgot-password
   - **Açıklama:** Sistem, kullanıcıların ve mekan sahiplerinin şifrelerini unutmaları durumunda e-posta doğrulaması aracılığıyla şifre sıfırlama talebinde bulunabilmelerini sağlamalıdır. Doğrulama sonrasında kullanıcı ve mekan sahibi yeni bir şifre belirleyebilmelidir.

30. **Favori Mekan Ekleme** (Ayşe Küçük)
   - **API Metodu:** `POST /favorites`
   - **Açıklama:** Sistem, kullanıcıların beğendikleri mekanları kişisel favori listelerine ekleyebilmelerini sağlamalıdır. Eklenen mekanlar profil üzerinden görüntülenebilmelidir.

31. **Favori Mekan Silme** (Ayşe Küçük)
   - **API Metodu:** `DELETE /favorites/{venuesId}`
   - **Açıklama:** Sistem, kullanıcıların daha önce favorilerine ekledikleri mekanları favori listesinden çıkarabilmesini sağlamalıdır. Silme işlemi sonrasında ilgili mekan kullanıcının favoriler listesinde görünmemelidir.

32. **Arkadaş Ekleme (İstek Gönderme)** (Ayşe Küçük)
   - **API Metodu:** `POST /friends/request`
   - **Açıklama:** Sistem, kullanıcıların diğer kullanıcılara arkadaşlık isteği gönderebilmesini sağlamalıdır. İstek karşı tarafın onayına sunulmalıdır.

33. **Arkadaşlık İsteği Bildirimi** (Ayşe Küçük)
   - **API Metodu:** `GET /notifications/friend-requests`
   - **Açıklama:** Sistem, kullanıcıya gönderilen arkadaşlık isteklerinin bildirim olarak görüntülenebilmesini sağlamalıdır. Kullanıcı gelen talepleri bu ekran üzerinden takip edebilmelidir.
    
     

# Gereksinim Dağılımları

1. [Ceren Doğan'ın Gereksinimleri](Ceren-Dogan/Ceren-Dogan-Gereksinimler.md)
2. [Sudenaz Kocabıçak'ın Gereksinimleri](Sudenaz-Kocabicak/Sudenaz-Kocabicak-Gereksinimler.md)
3. [İrem Ballı'nın Gereksinimleri](Irem-Balli/Irem-Balli-Gereksinimler.md)
4. [Ayşe Küçük'ün Gereksinimleri](Ayse-Kucuk/Ayse-Kucuk-Gereksinimler.md)
