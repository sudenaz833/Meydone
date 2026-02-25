1. **Arkadaşlık İsteği Onay** (İrem Ballı)
    - **API Metodu:** `PUT /friends/accept/{id}`
    - **Açıklama:** Sistem, kullanıcıların kendilerine gönderilen arkadaşlık isteklerini görüntüleyebilmesini ve bu istekleri kabul veya reddedebilmesini sağlamalıdır.

2. **Arkadaş Listesinden Silme** (İrem Ballı)
    - **API Metodu:** `DELETE /friends/{id}`
    - **Açıklama:** Sistem, kullanıcıların mevcut arkadaşlık ilişkilerini sonlandırabilmesini sağlamalıdır. Silme işlemi sonrasında iki kullanıcı arasındaki bağlantı sistemden kaldırılmalıdır.

3. **Arkadaş Listesini Görüntüleme** (İrem Ballı)
    - **API Metodu:** `GET /friends`
    - **Açıklama:** Sistem, kullanıcının arkadaş listesini görüntüleyebilmesini sağlamalıdır. Listede arkadaşlara ait temel profil bilgileri (ad, profil fotoğrafı, kullanıcı adı vb.) yer almalıdır.

4. **Konuma Göre Yakın Mekanları Listeleme** (İrem Ballı)
    - **API Metodu:** `GET /venues/nearby?lat={lat}&lng={lng}`
    - **Açıklama:** Sistem, kullanıcının konum bilgisine göre belirlenen mesafe aralığındaki mekanları listeleyebilmelidir. Mekanlar, kullanıcıya olan uzaklık bilgisi ile birlikte sunulmalıdır.

5. **Mekanları Harita Üzerinde Gösterme** (İrem Ballı)
    - **API Metodu:** `GET /venues/map`
    - **Açıklama:** Sistem, kayıtlı mekanların konum bilgilerini harita arayüzünde işaretleyerek kullanıcıların mekânsal olarak görüntüleyebilmesini sağlamalıdır. Her mekan için enlem ve boylam bilgisi sağlanmalıdır.

6. **Konum ve Paylaşım Gizlilik Ayarı** (İrem Ballı)
    - **API Metodu:** `POST /auth/privacy`
    - **Açıklama:** Sistem, kullanıcıların konum bilgilerini ve paylaştıkları içerikleri kimlerin görebileceğini belirleyebilecekleri gizlilik ayarları sunmalıdır. Kullanıcı, profil ayarları üzerinden görünürlük seviyesini yönetebilmelidir.

7. **Yorum Beğenme** (İrem Ballı)
    - **API Metodu:** `POST /comments/{id}/like`
    - **Açıklama:** Sistem, kullanıcıların diğer kullanıcılar tarafından yapılan yorumları beğenebilmesini sağlamalıdır. Beğeni işlemi, yorumun faydalı veya olumlu bulunduğunu göstermek amacıyla yapılır ve yorum üzerinde beğeni sayısı olarak görüntülenir.

8. **Admin Profiline Mekan için Gönderi Ekleme** (İrem Ballı)
    - **API Metodu:** `POST /admin/venues/{id}/photo`
    - **Açıklama:** Sistem, yetkili yöneticilerin belirli bir mekana fotoğraf yükleyebilmesini sağlamalıdır. Yüklenen görseller ilgili mekanın detay sayfasında görüntülenmelidir.