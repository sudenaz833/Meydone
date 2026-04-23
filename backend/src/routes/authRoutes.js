import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assertMenuRequestArray } from '../utils/venueMenu.js';

const router = Router();

const registerRules = [
  body('name')
    .isString()
    .withMessage('Ad metin (string) olmalıdır')
    .trim()
    .notEmpty()
    .withMessage('Ad zorunludur')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('Ad sadece harf içermelidir'),
  body('surname')
    .isString()
    .withMessage('Soyad metin (string) olmalıdır')
    .trim()
    .notEmpty()
    .withMessage('Soyad zorunludur')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('Soyad sadece harf içermelidir'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta girin')
    .custom((value) => String(value || '').toLowerCase().endsWith('@gmail.com'))
    .withMessage('Sadece @gmail.com uzantılı e-posta ile kayıt olabilirsiniz'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Kullanıcı adı zorunludur')
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı 3-30 karakter olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır'),
  body('birthDate')
    .notEmpty()
    .withMessage('Doğum tarihi zorunludur')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Doğum tarihi geçerli bir tarih olmalıdır')
    .custom((value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error('Doğum tarihi geçersiz');
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (d > today) {
        throw new Error('Doğum tarihi gelecekte olamaz');
      }
      return true;
    }),
  body('accountType')
    .optional()
    .isIn(['user', 'owner'])
    .withMessage('Hesap tipi user veya owner olmalıdır'),
  body().custom((_, { req }) => {
    const type = String(req.body.accountType || 'user').trim().toLowerCase();
    if (type !== 'owner') return true;

    const venue = req.body.venue;
    if (!venue || typeof venue !== 'object' || Array.isArray(venue)) {
      throw new Error('Mekan sahibi kaydı için mekan bilgileri zorunludur');
    }
    if (!String(venue.name || '').trim()) {
      throw new Error('Mekan adı zorunludur');
    }
    if (!String(venue.category || '').trim()) {
      throw new Error('Mekan kategorisi zorunludur');
    }
    const lat = Number(venue?.location?.lat);
    const lng = Number(venue?.location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Mekan konumu zorunludur');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Mekan konumu geçersiz');
    }
    if (!venue.address || typeof venue.address !== 'object' || Array.isArray(venue.address)) {
      throw new Error('Mekan adres bilgileri zorunludur');
    }
    if (!String(venue.address.neighborhood || '').trim()) {
      throw new Error('Mekan mahallesi zorunludur');
    }
    if (!String(venue.address.street || '').trim()) {
      throw new Error('Mekan sokak/cadde bilgisi zorunludur');
    }
    if (!Array.isArray(venue.menu)) {
      throw new Error('Mekan menüsü dizi formatında olmalıdır');
    }
    assertMenuRequestArray(venue.menu);
    if (!venue.hours || typeof venue.hours !== 'object' || Array.isArray(venue.hours)) {
      throw new Error('Mekan çalışma saatleri nesne formatında olmalıdır');
    }
    if (
      venue.photoUrl !== undefined &&
      venue.photoUrl !== null &&
      String(venue.photoUrl).trim() !== ''
    ) {
      const photo = String(venue.photoUrl).trim();
      const isHttp = /^https?:\/\//i.test(photo);
      const isDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(photo);
      if (!isHttp && !isDataImage) {
        throw new Error('Mekan fotoğrafı geçerli bir URL veya görsel verisi olmalıdır');
      }
      if (isDataImage) {
        const commaIndex = photo.indexOf(',');
        const base64 = commaIndex >= 0 ? photo.slice(commaIndex + 1) : '';
        const approxBytes = Math.floor((base64.length * 3) / 4);
        const maxBytes = 5 * 1024 * 1024;
        if (approxBytes > maxBytes) {
          throw new Error('Mekan fotoğrafı en fazla 5 MB olabilir');
        }
      }
    }
    return true;
  }),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('E-posta veya kullanıcı adı zorunludur'),
  body('password').notEmpty().withMessage('Şifre zorunludur'),
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('E-posta zorunludur')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta girin'),
];

const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Sıfırlama tokenı zorunludur'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır'),
];

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);
router.get('/me', protect, getMe);

export default router;
