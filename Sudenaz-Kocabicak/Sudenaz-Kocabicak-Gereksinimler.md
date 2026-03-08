1. **Mekan Sahibi Mekan Silme** (Sudenaz Kocabıçak)
    - **API Metodu:** `DELETE /admin/venues/{venuesId}`
    - **Açıklama:** Sistem, mekan sahiplerinin kendilerine ait işletme kayıtlarını sistemden silebilmesini sağlamalıdır. Silme işlemi yalnızca ilgili mekanın sahibi tarafından gerçekleştirilebilmelidir.

2. **Mekan Sahibi Üye Olma** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /admin/register`
    - **Açıklama:** Mekan sahiplerinin yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Ad, soyad, konum, açılış-kapanış saatleri ve menü içeriğini ve ilgili fotoğraf yükleme bilgilerinin toplanmasını ve hesap oluşturma işlemlerini içerir.Mekan sahibi email adresi ve şifre belirleyerek hesap oluşturur.

3. **Puan Verme** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /venues/{id}/rate`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların ziyaret ettikleri mekanlara belirli bir puan aralığında (örneğin 1–5 yıldız) değerlendirme yapabilmesini sağlamalıdır. Kullanıcıların deneyimlerini sayısal olarak ifade edebilmesini sağlamak ve diğer kullanıcıların mekan hakkında hızlı bir kalite değerlendirmesi yapabilmesine olanak tanımaktır.

4. **Ortalama Puan Hesaplama** (Sudenaz Kocabıçak)
    - **API Metodu:** `GET /venues/{id}/average-rating`
    - **Açıklama:** Sistem, kullanıcılar tarafından bir mekana verilen tüm puanları dikkate alarak ilgili mekanın ortalama puanını otomatik olarak hesaplamalı ve güncel değeri kullanıcı arayüzünde göstermelidir.

5. **Puana Göre Sıralama** (Sudenaz Kocabıçak)
    - **API Metodu:** `GET /venues/sort?by=rating`
    - **Açıklama:** Sistem, kullanıcıların mekanın ortalama puan değerlerine göre sıralayabilmesini sağlamalıdır. Kullanıcı, listeleme ekranında mekanı yüksek puandan düşüğe (azalan) veya düşük puandan yükseğe (artan) olacak şekilde sıralayabilmelidir.

6. **Kullanıcı Hesap Silme** (Sudenaz Kocabıçak)
    - **API Metodu:** `DELETE /users/account`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların kendi hesaplarını kalıcı olarak silebilmesine olanak sağlamalıdır. Hesap silme işlemi, kullanıcının kimlik doğrulaması yapmasının ardından gerçekleştirilmelidir.

7. **Kullanıcı Profil Güncelleme** (Sudenaz Kocabıçak)
    - **API Metodu:** `PUT /users/profile`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların kendi profil bilgilerini güncelleyebilmesini sağlamalıdır. Kullanıcı; ad-soyad, profil fotoğrafı, telefon numarası, şifre ve benzeri kişisel bilgilerini düzenleyebilmelidir.

8. **Profile Gönderi Ekleme** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /users/posts`
    - **Açıklama:** Sistem, kayıtlı kullanıcıların kendi profilleri üzerinden gönderi (post) paylaşabilmesini sağlamalıdır. Kullanıcı, metin içeriği ve isteğe bağlı olarak görsel ekleyerek profilinde paylaşım yapabilmelidir.