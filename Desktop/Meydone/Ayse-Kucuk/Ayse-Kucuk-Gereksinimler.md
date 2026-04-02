1. **Saat Güncelleme** (Ayşe Küçük)
    - **API Metodu:** `PUT /admin/venues/{id}/hours`
    - **Açıklama:** Sistem, yetkili yöneticinin ilgili mekana ait çalışma saatlerini güncelleyebilmesini sağlamalıdır. Güncellenen bilgiler kullanıcı arayüzünde anlık ve doğru şekilde görüntülenmelidir.

2. **Konum Güncelleme** (Ayşe Küçük)
    - **API Metodu:** `PUT /admin/venues/{id}/location`
    - **Açıklama:** Sistem, yetkili yöneticinin mekana ait coğrafi konum bilgilerini (enlem ve boylam) güncelleyebilmesini sağlamalıdır.Güncellenen konum bilgisi harita üzerinde doğru şekilde yansıtılmalıdır.


3. **Menü Güncelleme** (Ayşe Küçük)
    - **API Metodu:** `PUT /admin/venues/{id}/menu`
    - **Açıklama:** Sistem, yetkili yöneticinin mekana ait menü içeriklerini güncelleyebilmesini sağlamalıdır. Yapılan değişiklikler kullanıcılar tarafından görüntülenebilir olmalıdır.

4. **Şifre Sıfırlama** (Ayşe Küçük)
    - **API Metodu:** `POST /auth/forgot-password`
    - **Açıklama:** Sistem, kullanıcıların ve mekan sahiplerinin şifrelerini unutmaları durumunda e-posta doğrulaması aracılığıyla şifre sıfırlama talebinde bulunabilmelerini sağlamalıdır. Doğrulama sonrasında kullanıcı ve mekan sahibi yeni bir şifre belirleyebilmelidir.


5. **Favori Mekan Ekleme** (Ayşe Küçük)
    - **API Metodu:** `POST /favorites`
    - **Açıklama:** Sistem, kullanıcıların beğendikleri mekanları kişisel favori listelerine ekleyebilmelerini sağlamalıdır. Eklenen mekanlar profil üzerinden görüntülenebilmelidir.

6. **Favori Mekan Silme** (Ayşe Küçük)
    - **API Metodu:** `DELETE /favorites/{venuesId}`
    - **Açıklama:** Sistem, kullanıcıların daha önce favorilerine ekledikleri mekanları favori listesinden çıkarabilmesini sağlamalıdır. Silme işlemi sonrasında ilgili mekan kullanıcının favoriler listesinde görünmemelidir.

7. **Arkadaş Ekleme** (Ayşe Küçük)
    - **API Metodu:** `POST /friends/request`
    - **Açıklama:** Sistem, kullanıcıların diğer kullanıcılara arkadaşlık isteği gönderebilmesini sağlamalıdır. İstek karşı tarafın onayına sunulmalıdır.

8. **Arkadaşlık İsteği Bildirimi** (Ayşe Küçük)
    - **API Metodu:** `GET /notifications/friend-requests`
    - **Açıklama:** Sistem, kullanıcıya gönderilen arkadaşlık isteklerinin bildirim olarak görüntülenebilmesini sağlamalıdır. Kullanıcı gelen talepleri bu ekran üzerinden takip edebilmelidir.   