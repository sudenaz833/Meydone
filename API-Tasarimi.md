# API Tasarımı - OpenAPI Specification Örneği

**OpenAPI Spesifikasyon Dosyası:** [Meydone.yaml](Meydone.yaml)

Bu doküman, OpenAPI Specification (OAS) 3.0 standardına göre hazırlanmış "Sosyal Mekan" API tasarımını içermektedir.

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Meydone API
  version: 1.0.0
  description: >
    Meydone, kullanıcıların konum bazlı mekan keşfi yapabildiği ve sosyal etkileşimde bulunabildiği platformdur. 
    API; kullanıcı, mekan ve yorum yönetimini, sosyal etkileşimleri ve mekan sahipleri için yönetim işlemlerini kapsar.
  contact:
    name: Meydone Destek Ekibi
    email: support@meydone.com
servers:
  - url: https://api.meydone.com/v1
    description: Production server
  - url: https://staging.meydone.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Development server

tags:
  - name: auth
    description: Kimlik doğrulama işlemleri
  - name: users
    description: Kullanıcı işlemleri
  - name: venues
    description: Mekan işlemleri
  - name: comments
    description: Yorum işlemleri
  - name: friends
    description: Arkadaş işlemleri
  - name: favorites
    description: Favori mekan işlemleri
  - name: admin
    description: Yönetici ve Mekan Sahibi işlemleri
  - name: notifications
    description: Bildirimler

paths:
  # -------------------- AUTH --------------------
  /auth/register:
    post:
      tags: [auth]
      summary: Kullanıcı Üye Olma
      description: Kullanıcı yeni hesap oluşturur.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserRegistration'
      responses:
        '201':
          description: Kullanıcı oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

  /auth/login:
    post:
      tags: [auth]
      summary: Giriş Yapma
      description: Email ve şifre ile giriş yapar, JWT token döner.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginCredentials'
      responses:
        '200':
          description: Giriş başarılı
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthToken'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/LoginUnauthorized'

  /auth/update-password:
    put:
      tags: [auth]
      summary: Şifre Güncelleme
      description: Sistem, giriş yapmış olan kullanıcıların ve mekan sahiplerinin mevcut şifrelerini doğrulayarak kendi profilleri üzerinden yeni bir şifre belirlemelerini ve şifrelerini güncellemelerini sağlamalıdır.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [currentPassword, newPassword]
              properties:
                currentPassword:
                  type: string
                  format: password
                  example: "eskiSifrem123!"
                newPassword:
                  type: string
                  format: password
                  example: "yeniSifrem456*"  
      responses:
        '200':
          description: Şifre başarıyla güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'

  # -------------------- USERS --------------------
  /users/{id}:
    delete:
      tags: [users]
      summary: Kullanıcı Hesap Silme
      description: Belirtilen ID'ye sahip kullanıcının hesabını sistemden kalıcı olarak siler.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
            example: "550e8400-e29b-41d4-a716-446655440000"
      responses:
        '204':
          description: Hesap silindi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /users/profile:
    put:
      tags: [users]
      summary: Kullanıcı Profil Güncelleme
      description: Sisteme giriş yapmış kullanıcının kendi kişisel profil bilgilerini (ad, soyad, telefon numarası vb.) güncellemesini sağlar.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
      responses:
        '200':
          description: Profil güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /users/posts:
    post:
      tags: [users]
      summary: Profile Gönderi Ekleme
      description: Kullanıcının kendi profiline yeni bir gönderi (post) eklemesini sağlar.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [content]
              properties:
                content:
                  type: string
                  example: "Bugün yeni bir mekan keşfettim, kahveleri harika!"
                imageUrl:
                  type: string
                  format: uri
                  example: "https://example.com/photos/messi-coffee.jpg"
      responses:
        '201':
          description: Gönderi paylaşıldı
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /users/privacy:
    post:
      tags: [users]
      summary: Konum ve Paylaşım Gizlilik Ayarı
      description: Kullanıcının platform üzerindeki anlık konumunun ve paylaştığı gönderilerin kimler tarafından görülebileceğini yapılandırmasını sağlar.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                locationVisibility:
                  type: string
                  enum: [public, friends, private]
                  example: "friends"
                postVisibility:
                  type: string
                  enum: [public, friends, private]
                  example: "public"
      responses:
        '200':
          description: Ayarlar güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  # -------------------- FRIENDS --------------------
  /friends:
    get:
      tags: [friends]
      summary: Arkadaş Listesini Görüntüleme
      description: Kullanıcının mevcut onaylı arkadaş listesini getirir. Kullanıcının gizlilik ayarlarına göre ilgili veriler döndürülür.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Arkadaş listesi başarıyla getirildi
        '401':
          $ref: '#/components/responses/Unauthorized'

  /friends/request:
    post:
      tags: [friends]
      summary: Arkadaş Ekleme - İstek Gönderme
      description: Belirtilen ID'ye sahip kullanıcıya arkadaşlık isteği gönderir. Eğer istek zaten gönderilmişse veya zaten arkadaşsalar uygun hata kodu döner.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [friendId]
              properties:
                friendId:
                  type: string
                  format: uuid
                  example: "550e8400-e29b-41d4-a716-446655440000"
      responses:
        '201':
          description: İstek gönderildi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'

  /friends/accept/{id}:
    put:
      tags: [friends]
      summary: Arkadaşlık İsteği Onay
      description: Gelen bir arkadaşlık isteğini onaylar. Bu işlem sonucunda her iki kullanıcı da birbirlerinin arkadaş listesine eklenir.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: İstek kabul edildi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /friends/{id}:
    delete:
      tags: [friends]
      summary: Arkadaş Listesinden Silme
      description: Belirtilen ID'ye sahip kullanıcıyı arkadaş listesinden çıkarır veya bekleyen arkadaşlık isteğini reddeder. Bu işlem kalıcıdır.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Arkadaş silindi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  # -------------------- VENUES --------------------
  /venues/search:
    get:
      tags: [venues]
      summary: İsimle Mekan Arama
      description: Kullanıcıların platformda kayıtlı olan mekanları isimlerine veya ismin bir kısmına göre aramasını sağlar. Büyük/küçük harf duyarsızdır.
      parameters:
        - name: name
          in: query
          required: true
          schema:
            type: string
            example: "Starbucks"
      responses:
        '200':
          description: Arama sonuçları listelendi
        '400':
          $ref: '#/components/responses/BadRequest'

  /venues/filter:
    get:
      tags: [venues]
      summary: Kategoriye Göre Mekan Filtreleme
      description: Kategori parametresine göre mekanları filtreleyerek listeler. Örneğin sadece "Cafe" veya "Restoran" kategorisindeki mekanların getirilmesi için kullanılır.
      parameters:
        - name: category
          in: query
          required: true
          schema:
            type: string
            example: "Cafe"
      responses:
        '200':
          description: Filtrelenmiş sonuçlar getirildi
        '400':
          $ref: '#/components/responses/BadRequest'

  /venues/nearby:
    get:
      tags: [venues]
      summary: Konuma Göre Yakın Mekanları Listeleme
      description: Kullanıcının gönderdiği enlem (lat) ve boylam (lng) koordinatlarına göre belirli bir yarıçap içindeki (yakındaki) mekanları listeler.
      parameters:
        - name: lat
          in: query
          required: true
          schema:
            type: number
            example: 41.0082
        - name: lng
          in: query
          required: true
          schema:
            type: number
            example: 28.9784
      responses:
        '200':
          description: Yakındaki mekanlar listelendi
        '400':
          $ref: '#/components/responses/BadRequest'

  /venues/map:
    get:
      tags: [venues]
      summary: Mekanları Harita Üzerinde Gösterme
      description: Arama, filtreleme veya konum bazlı listelenen mekanların harita üzerinde işaretlenebilmesi için gerekli olan koordinat verilerini toplu olarak döndürür.
      responses:
        '200':
          description: Harita koordinatları getirildi

  /venues/{id}/rate:
    post:
      tags: [venues]
      summary: Puan Verme
      description: Belirtilen mekana 1 ile 5 arasında bir puan verilmesini sağlar. Kullanıcı tekrar puan verdiğinde mevcut puanı güncellenir.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [rating]
              properties:
                rating:
                  type: integer
                  minimum: 1
                  maximum: 5
                  example: 5
      responses:
        '201':
          description: Puan başarıyla kaydedildi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /venues/{id}/average-rating:
    get:
      tags: [venues]
      summary: Ortalama Puan Hesaplama
      description: Belirtilen mekanın tüm kullanıcılar tarafından verilmiş olan puanlarının aritmetik ortalamasını hesaplar ve döndürür.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Ortalama puan başarıyla hesaplandı
        '404':
          $ref: '#/components/responses/NotFound'

  /venues/sort:
    get:
      tags: [venues]
      summary: Puana Göre Sıralama
      description: Mekanları alınan ortalama puanlara (veya belirtilen diğer kriterlere) göre yüksekten düşüğe doğru sıralayarak listeler.
      parameters:
        - name: by
          in: query
          required: true
          schema:
            type: string
            enum: [rating]
            example: "rating"
      responses:
        '200':
          description: Mekanlar puana göre sıralandı
        '400':
          $ref: '#/components/responses/BadRequest'

  # -------------------- COMMENTS --------------------
  /comments:
    post:
      tags: [comments]
      summary: Yorum Yapma
      description: Kullanıcının belirtilen mekana metin tabanlı bir değerlendirme (yorum) yapmasını sağlar. 
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [venueId, content]
              properties:
                venueId:
                  type: string
                  format: uuid
                  example: "123e4567-e89b-12d3-a456-426614174000"
                content:
                  type: string
                  example: "Atmosferi harika, kesinlikle tavsiye ederim."
      responses:
        '201':
          description: Yorum oluşturuldu
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /comments/{id}:
    put:
      tags: [comments]
      summary: Yorum Güncelleme
      description: Kullanıcının daha önce yapmış olduğu bir yorumun metnini  güncellemesini sağlar.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [content]
              properties:
                content:
                  type: string
                  example: "Atmosferi harika, menüsü de güncellenmiş."
      
      responses:
        '200':
          description: Yorum güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
    delete:
      tags: [comments]
      summary: Yorum Silme
      description: Kullanıcının daha önce yapmış olduğu bir yorumu sistemden kalıcı olarak siler. Yorum silindiğinde o yoruma ait fotoğraflar da kaldırılır.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Yorum silindi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /comments/{id}/photo:
    post:
      tags: [comments]
      summary: Yoruma Fotoğraf Ekleme
      description: Belirli bir yoruma görsel (fotoğraf) eklenmesini sağlar. Multipart form data kullanılarak dosya yüklemesi gerçekleştirilir.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '201':
          description: Fotoğraf eklendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403': 
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /comments/{id}/like:
    post:
      tags: [comments]
      summary: Yorum Beğenme
      description: Başka bir kullanıcının yaptığı yorumu beğenmeyi veya önceden beğenilmişse beğeniyi geri çekmeyi sağlar (toggle mantığı).
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Beğeni eklendi veya geri çekildi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  # -------------------- FAVORITES --------------------
  /favorites:
    post:
      tags: [favorites]
      summary: Favori Mekan Ekleme
      description: Belirtilen mekanı kullanıcının favoriler listesine (kaydedilenler) ekler. Kullanıcının sevdiği mekanlara daha sonra kolayca ulaşmasını sağlar.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [venueId]
              properties:
                venueId:
                  type: string
                  format: uuid
                  example: "123e4567-e89b-12d3-a456-426614174000"
      responses:
        '201':
          description: Favorilere eklendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '409': 
          $ref: '#/components/responses/Conflict'

  /favorites/{venueId}:
    delete:
      tags: [favorites]
      summary: Favori Mekan Silme
      description: Belirtilen mekanı kullanıcının favoriler (kaydedilenler) listesinden çıkarır.
      security:
        - bearerAuth: []
      parameters:
        - name: venueId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Favoriden çıkarıldı
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  # -------------------- NOTIFICATIONS --------------------
  /notifications/comment-likes:
    get:
      tags: [notifications]
      summary: Yoruma Gelen Beğeni Bildirimi
      description: Kullanıcının yaptığı yorumlara gelen yeni beğenilerin bildirimlerini (notification) listeler.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Beğeni bildirimleri listelendi
        '401':
          $ref: '#/components/responses/Unauthorized'

  /notifications/friend-requests:
    get:
      tags: [notifications]
      summary: Arkadaşlık İsteği Bildirimi
      description: Kullanıcıya gönderilen ancak henüz onaylanmamış veya reddedilmemiş arkadaşlık isteklerinin bildirimlerini listeler.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Bekleyen arkadaşlık istekleri getirildi
        '401':
          $ref: '#/components/responses/Unauthorized'

  # -------------------- ADMIN --------------------
  /admin/register:
    post:
      tags: [admin]
      summary: Mekan Sahibi Üye Olma
      description: Yeni bir mekan sahibini ve o kişiye ait mekanın işletme kayıt bilgilerini sisteme kaydeder.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                  example: "iletisim@lezzetduragi.com"
                password:
                  type: string
                  example: "AdminSifre2024!"
                name:
                  type: string
                  example: "Lezzet Durağı"
                address:
                  type: string
                  example: "Aksu, Isparta"
                openTime:
                  type: string
                  example: "09:00"
                closeTime:
                  type: string
                  example: "23:00"
      responses:
        '201':
          description: Mekan sahibi ve işletme kaydı oluşturuldu
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

  /admin/venues/{id}:
    delete:
      tags: [admin]
      summary: Mekan Sahibi Mekan Silme
      description: Mekan sahibinin veya yöneticinin yetkisi altındaki bir mekanı sistemden tamamen silmesini sağlar. Mekana ait menü, yorum ve fotoğraflar da silinir.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Mekan silindi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /admin/venues/{id}/photo:
    post:
      tags: [admin]
      summary: Admin/Mekan Sahibi Fotoğraf Yükleme
      description: Mekan profilinin vitrinine resmi bir fotoğraf yüklenmesini sağlar. Sadece yetkili mekan sahibi kullanabilir.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '201':
          description: Fotoğraf yüklendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /admin/venues/{id}/hours:
    put:
      tags: [admin]
      summary: Saat Güncelleme
      description: Mekanın açılış ve kapanış saatlerini günceller. Sadece yetkili mekan sahibi kullanabilir.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                openTime:
                  type: string
                  example: "08:00"
                closeTime:
                  type: string
                  example: "22:00"
      responses:
        '200':
          description: Saatler güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /admin/venues/{id}/location:
    put:
      tags: [admin]
      summary: Konum Güncelleme
      description: Mekanın harita üzerindeki enlem (lat) ve boylam (lng) koordinatlarını (konumunu) günceller.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                lat:
                  type: number
                  example: 41.0082
                lng:
                  type: number
                  example: 28.9784
      responses:
        '200':
          description: Konum bilgisi güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /admin/venues/{id}/menu:
    put:
      tags: [admin]
      summary: Menü Güncelleme
      description: Mekanın sunduğu ürün veya hizmetlerin menüsünü, isim ve fiyat bilgileriyle birlikte toplu olarak günceller.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                items:
                  type: array
                  items:
                    type: object
                    properties:
                      name:
                        type: string
                        example: "Latte"
                      price:
                        type: number
                        example: 95.50
      responses:
        '200':
          description: Menü güncellendi
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  responses:
    BadRequest:
      description: Geçersiz istek (Eksik veya hatalı parametre)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error400'
    Unauthorized:
      description: Yetkisiz erişim (Token eksik veya geçersiz)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error401'
    LoginUnauthorized:
      description: Giriş başarısız (E-posta veya şifre hatalı)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AuthError'
    Forbidden:
      description: Erişim reddedildi (Bu işlemi yapmak için yetkiniz yok)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error403'
    NotFound:
      description: Kaynak bulunamadı (ID veya URL hatalı)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error404'
    Conflict:
      description: Çakışma durumu (Örn. Email zaten kayıtlı veya arkadaşlık zaten ekli)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error409'

  schemas:
    # -------------------- HATA ŞEMALARI (ÖZELLEŞTİRİLMİŞ) --------------------
    Error400:
      type: object
      properties:
        message: 
          type: string
          example: "Lütfen zorunlu alanları eksiksiz ve doğru formatta doldurunuz."
          
    Error401:
      type: object
      properties:
        message: 
          type: string
          example: "Bu işlemi gerçekleştirebilmek için geçerli bir oturum açmanız gerekmektedir."

    AuthError:
      type: object
      properties:
        message: 
          type: string
          example: "Girdiğiniz e-posta adresi veya şifre hatalı. Lütfen tekrar deneyin."

    Error403:
      type: object
      properties:
        message: 
          type: string
          example: "Bu kaynağa erişmek veya bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor."

    Error404:
      type: object
      properties:
        message: 
          type: string
          example: "İşlem yapmak istediğiniz kayıt (kullanıcı, mekan, yorum vb.) bulunamadı."

    Error409:
      type: object
      properties:
        message: 
          type: string
          example: "Bu kayıt zaten sistemde mevcut veya bir çakışma var."

    # -------------------- MEsSI ÖRNEKLERİ (KULLANICI BİLGİLERİ) --------------------
    UserRegistration:
      type: object
      required: [email, password, firstName, lastName]
      properties:
        email: 
          type: string
          format: email
          example: "leo.messi@example.com"
        password: 
          type: string
          example: "InterMiami10!"
        firstName: 
          type: string
          example: "Lionel"
        lastName: 
          type: string
          example: "Messi"
    
    LoginCredentials:
      type: object
      required: [email, password]
      properties:
        email: 
          type: string
          format: email
          example: "leo.messi@example.com"
        password: 
          type: string
          example: "InterMiami10!"

    AuthToken:
      type: object
      properties:
        token: 
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        user: 
          $ref: '#/components/schemas/User'

    User:
      type: object
      properties:
        id: 
          type: string
          format: uuid
          example: "550e8400-e29b-41d4-a716-446655440000"
        firstName: 
          type: string
          example: "Lionel"
        lastName: 
          type: string
          example: "Messi"
        email: 
          type: string
          format: email
          example: "leo.messi@example.com"

    UserUpdate:
      type: object
      properties:
        firstName: 
          type: string
          example: "Lionel Andres"
        lastName: 
          type: string
          example: "Messi"
        phoneNumber: 
          type: string
          example: "+1-305-555-0010"
``