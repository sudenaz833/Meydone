1. **Giriş Yapma** (Ceren Doğan)
    - **API Metodu:** `POST /auth/login`
    - **Açıklama:** Kullanıcıların ve mekan sahibinin sisteme giriş yaparak hizmetlere erişmesini sağlar. Email adresi ve şifre ile kimlik doğrulama yapılır.

2. **Kullanıcı Üye Olma** (Ceren Doğan)
    - **API Metodu:** `POST /auth/register`
    - **Açıklama:** Kullanıcıların yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Ad, soyad, doğum tarihi, email ve şifre bilgilerini içerir.

3. **Yorum Yapma** (Ceren Doğan)
    - **API Metodu:** `POST /comments`
    - **Açıklama:** Kullanıcıların restoranlar hakkında deneyimlerini, puanlarını ve görüşlerini paylaşabilmesini sağlar.

4. **Yoruma Fotoğraf Ekleme** (Ceren Doğan)
    - **API Metodu:** `POST /comments/{id}/photo`
    - **Açıklama:** Kullanıcının mekan hakkında yaptığı yorumu görsel ile desteklemesini sağlayarak etkileşimi artırır.

5. **Yorum Silme** (Ceren Doğan)
    - **API Metodu:** `DELETE /comments/{id}`
    - **Açıklama:** Kullanıcıların, sisteme daha önce ekledikleri yorumları silebilmesini sağlar.

6. **Yorum Güncelleme** (Ceren Doğan)
    - **API Metodu:** `PUT /comments/{id}`
    - **Açıklama:** Kullanıcıların yazım hatalarını düzeltmesine veya puanlarını güncellemesine olanak tanır.

7. **İsimle Mekan Arama** (Ceren Doğan)
    - **API Metodu:** `GET /venues/search?name=`
    - **Açıklama:** Kullanıcıların sistemde kayıtlı olan mekanları adlarına göre arayabilmesini ve eşleşmeleri listelemesini sağlar.

8. **Kategoriye Göre Mekan Filtreleme** (Ceren Doğan)
    - **API Metodu:** `GET /venues/filter?category=`
    - **Açıklama:** Kullanıcıların ihtiyaç duydukları mekan türüne (kafe, restoran vb.) hızlı ve kolay ulaşmasını sağlar.

9. **Yoruma Gelen Beğeni Bildirimi** (Ceren Doğan)
    - **API Metodu:** `GET /notifications/comment-likes`
    - **Açıklama:** Kullanıcının yorumuna beğeni geldiğinde sistem tarafından ilgili kullanıcıya bildirim gönderilmesini sağlar.