1. **Giriş Yapma** (Ceren Doğan)
    - **API Metodu:** `POST /auth/login`
    - **Açıklama:** Kullanıcıların ve mekan sahibinin sisteme giriş yaparak hizmetlere erişmesini sağlar. Email adresi-kullanıcı adı ve şifre ile kimlik doğrulama yapılır. Başarılı giriş sonrası kullanıcıya ve mekan sahibine erişim izni verilir ve kişisel verilerin güvenliği sağlanır.


2. **Kullanıcı Üye Olma** (Ceren Doğan)
    - **API Metodu:** `POST /auth/register`
    - **Açıklama:** Kullanıcıların yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Kişisel bilgilerin toplanmasını (ad,soyad,doğum tarihi) ve hesap oluşturma işlemlerini içerir. Kullanıcılar email adresi,kullanıcı adı ve şifre belirleyerek hesap oluşturur.


3. **Yorum Yapma** (Ceren Doğan)
    - **API Metodu:** `POST /comments`
    - **Açıklama:** Kullanıcıların restoranlar hakkında deneyimlerini, görüşlerini paylaşabilmesini sağlamak. Bu özellik sayesinde uygulama, kullanıcı deneyimine dayalı dinamik bir içerik yapısına sahip olur.
    

4. **Yoruma Fotoğraf Ekleme** (Ceren Doğan)
    - **API Metodu:** `POST /comments/{id}/photo`
    - **Açıklama:** Kullanıcının mekan hakkında yaptığı yorumu görsel ile desteklemesini sağlar. Bu özellik sayesinde kullanıcılar deneyimlerini daha gerçekçi ve görsel destekli şekilde paylaşabilirler. Uygulamanın güvenilirliği ve etkileşimi artar.


5. **Yorum Silme** (Ceren Doğan)
    - **API Metodu:** `DELETE /comments/{id}`
    - **Açıklama:** Kullanıcıların, sisteme daha önce ekledikleri yorumları silebilmesini sağlamak. Bu özellik sayesinde kullanıcı hatalı, eski veya uygunsuz içerikleri sistemden kaldırabilir.


6. **Yorum Güncelleme** (Ceren Doğan)
    - **API Metodu:** `PUT /comments/{id}`
    - **Açıklama:** Kullanıcıların daha önce yaptıkları yorumları güncelleyebilmesini sağlamak.Bu özellik sayesinde kullanıcılar yazım hatalarını düzeltebilir veya deneyimleri değiştiyse yorumlarını güncelleyebilir.


7. **İsimle Mekan Arama** (Ceren Doğan)
    - **API Metodu:** `GET /venues/search?name=`
    - **Açıklama:** Kullanıcıların sistemde kayıtlı olan mekanları adlarına göre arayabilmesini sağlar. Kullanıcı arama çubuğuna bir mekan ismi veya ismin bir kısmını yazdığında, sistem girilen ifadeye uygun eşleşmeleri veritabanında sorgular ve sonuçları liste halinde kullanıcıya sunar.

8. **Kategoriye Göre Mekan Filtreleme** (Ceren Doğan)
    - **API Metodu:** `GET /venues/filter?category=`
    - **Açıklama:** Kullanıcıların uygulama içerisinde kayıtlı mekanları belirli kategori kriterlerine göre filtreleyebilmesini sağlamalıdır. Kullanıcıların ihtiyaç duydukları mekan türüne hızlı, kolay ve doğru bir şekilde ulaşmalarını sağlar.


9. **Yoruma Gelen Beğeni Bildirimi** (Ceren Doğan)
    - **API Metodu:** `GET /notifications/comment-likes`
    - **Açıklama:** Sistem, kullanıcıların yaptıkları yorumlara başka kullanıcılar tarafından beğeni (like) bırakılması durumunda, ilgili kullanıcıya bildirim gönderilir.
