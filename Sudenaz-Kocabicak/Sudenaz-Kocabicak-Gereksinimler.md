1. **Mekan Sahibi Mekan Silme** (Sudenaz Kocabıçak)
    - **API Metodu:** `DELETE /admin/venues/{venuesId}`
    - **Açıklama:** Sistem, mekan sahiplerinin kendilerine ait işletme kayıtlarını sistemden silebilmesini sağlamalıdır. Silme işlemi yalnızca ilgili mekanın sahibi tarafından gerçekleştirilebilmelidir.

2. **Mekan Sahibi Üye Olma** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /admin/register`
    - **Açıklama:** Mekan sahiplerinin yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Ad, soyad, konum, açılış-kapanış saatleri ve menü bilgilerini içerir.

3. **Puan Verme** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /venues/{id}/rate`
    - **Açıklama:** Kayıtlı kullanıcıların ziyaret ettikleri mekanlara belirli bir puan aralığında (1–5 yıldız) değerlendirme yapabilmesini sağlar.

4. **Ortalama Puan Hesaplama** (Sudenaz Kocabıçak)
    - **API Metodu:** `GET /venues/{id}/average-rating`
    - **Açıklama:** Sistem, mekana verilen tüm puanları dikkate alarak ortalama puanı otomatik hesaplar ve arayüzde gösterir.

5. **Puana Göre Sıralama** (Sudenaz Kocabıçak)
    - **API Metodu:** `GET /venues/sort?by=rating`
    - **Açıklama:** Kullanıcıların mekanları yüksekten düşüğe veya düşükten yükseğe puan değerlerine göre sıralayabilmesini sağlar.

6. **Kullanıcı Hesap Silme** (Sudenaz Kocabıçak)
    - **API Metodu:** `DELETE /auth/account`
    - **Açıklama:** Kayıtlı kullanıcıların kendi hesaplarını kimlik doğrulaması yaptıktan sonra kalıcı olarak silebilmesine olanak sağlar.

7. **Kullanıcı Profil Güncelleme** (Sudenaz Kocabıçak)
    - **API Metodu:** `PUT /auth/profile`
    - **Açıklama:** Kullanıcıların ad-soyad, profil fotoğrafı ve şifre gibi kişisel bilgilerini düzenleyebilmesini sağlar.

8. **Profile Gönderi Ekleme** (Sudenaz Kocabıçak)
    - **API Metodu:** `POST /auth/posts`
    - **Açıklama:** Kullanıcıların metin içeriği ve isteğe bağlı görsel ekleyerek kendi profilleri üzerinden paylaşım yap