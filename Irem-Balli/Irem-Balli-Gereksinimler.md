1. **Arkadaşlık İsteği Onay** (İrem Ballı)
    - **API Metodu:** `PUT /friends/accept/{id}`
    - **Açıklama:** Sistem, kullanıcıların kendilerine gönderilen arkadaşlık isteklerini görüntüleyebilmesini ve bu istekleri kabul veya reddedebilmesini sağlamalıdır.

2. **Arkadaş Listesinden Silme** (İrem Ballı)
    - **API Metodu:** `DELETE /friends/{id}`
    - **Açıklama:** Sistem, kullanıcıların mevcut arkadaşlık ilişkilerini sonlandırabilmesini sağlamalıdır.

3. **Arkadaş Listesini Görüntüleme** (İrem Ballı)
    - **API Metodu:** `GET /friends`
    - **Açıklama:** Sistem, kullanıcının arkadaş listesini görüntüleyebilmesini sağlamalıdır.

4. **Konuma Göre Yakın Mekanları Listeleme** (İrem Ballı)
    - **API Metodu:** `GET /venues/nearby?lat={lat}&lng={lng}`
    - **Açıklama:** Sistem, kullanıcının konum bilgisine göre belirlenen mesafe aralığındaki mekanları listeleyebilmelidir.

5. **Mekanları Harita Üzerinde Gösterme** (İrem Ballı)
    - **API Metodu:** `GET /venues/map`
    - **Açıklama:** Kayıtlı mekanların konum bilgilerini harita arayüzünde işaretleyerek görüntüleme sağlar.

6. **Konum ve Paylaşım Gizlilik Ayarı** (İrem Ballı)
    - **API Metodu:** `POST /auth/privacy`
    - **Açıklama:** Kullanıcıların konum ve içerik görünürlük seviyesini yönetebilmesini sağlar.

7. **Yorum Beğenme** (İrem Ballı)
    - **API Metodu:** `POST /comments/{id}/like`
    - **Açıklama:** Kullanıcıların yorumları beğenebilmesini ve beğeni sayısının görüntülenmesini sağlar.

8. **Admin Profiline Mekan için Gönderi Ekleme** (İrem Ballı)
    - **API Metodu:** `POST /admin/venues/{id}/photo`
    - **Açıklama:** Yetkili yöneticilerin belirli bir mekana fotoğraf yükleyebilmesini sağlar.