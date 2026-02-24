# Ali Tutar'ın REST API Metotları

## 1. Üye Olma
- **Endpoint:** `POST /auth/register`
- **Açıklama:** Kullanıcıların yeni hesaplar oluşturarak hizmetin tüm özelliklerine erişmelerini ve etkileşimde bulunmalarını sağlar. Kullanıcıların kişisel bilgilerinin toplanmasını ve hesap doğrulama işlemlerinin yapılmasını içerir.
- **Request Body:** 
  ```json
  {
    "email": "kullanici@example.com",
    "password": "Guvenli123!",
    "firstName": "Ahmet",
    "lastName": "Yılmaz"
  }
  ```
- **Response:** `201 Created` - Kullanıcı başarıyla oluşturuldu

## 2. Kullanıcı Bilgilerini Görüntüleme
- **Endpoint:** `GET /users/{userId}`
- **Açıklama:** Belirli bir kullanıcının detay bilgilerini getirir. Kullanıcı ID'si ile kullanıcının profil bilgileri, kişisel verileri ve hesap durumu gibi detaylı bilgilere erişim sağlar.
- **Path Parameters:** 
  - `userId` (string, required) - Kullanıcı ID'si
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Kullanıcı bilgileri başarıyla getirildi

## 3. Kullanıcı Bilgilerini Güncelleme
- **Endpoint:** `PUT /users/{userId}`
- **Açıklama:** Kullanıcı bilgilerini güncelleme işlemini sağlar. Kullanıcılar ad, soyad, email, telefon gibi kişisel bilgilerini güncelleyebilir veya profil ayarlarını değiştirebilir.
- **Path Parameters:** 
  - `userId` (string, required) - Kullanıcı ID'si
- **Request Body:** 
  ```json
  {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "yeniemail@example.com",
    "phone": "+905551234567"
  }
  ```
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Kullanıcı başarıyla güncellendi

## 4. Kullanıcı Silme
- **Endpoint:** `DELETE /users/{userId}`
- **Açıklama:** Kullanıcıyı sistemden kalıcı olarak silme işlemini sağlar. Kullanıcı hesabını kapatmak istediğinde veya yönetici tarafından hesap kapatılması gerektiğinde kullanılır.
- **Path Parameters:** 
  - `userId` (string, required) - Kullanıcı ID'si
- **Authentication:** Bearer Token gerekli (Yönetici yetkisi veya kendi hesabını silme yetkisi)
- **Response:** `204 No Content` - Kullanıcı başarıyla silindi
