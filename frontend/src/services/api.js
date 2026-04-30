import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

// 1. Dinamik IP Ayarı: Tarayıcı adresine göre karar veriyoruz
// ... diğer importlar aynı kalsın

const getBaseURL = () => {
  // 1. Önce ortam değişkenlerine bak (Vercel ve build işlemleri için en sağlıklısı bu)
  //if (import.meta.env.VITE_API_TARGET) {
    //return `${import.meta.env.VITE_API_TARGET}/api`;
  //}

  // 2. Eğer .env yoksa tarayıcı adresine bak (Lokal geliştirme için)
  //if (typeof window !== 'undefined') {
    //if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      //return "http://localhost:9000/api";
    //}
  //}

  // 3. iPhone ve Vercel için "Kurtarıcı" adres (Buraya Kendi Railway Linkini Yaz!)
  // DİKKAT: Buraya dün geceki 192.168... yerine Railway adresini yapıştır.

  // Değişkeni al ve sağındaki-solundaki boşlukları/slashları temizle
  let baseURL = import.meta.env.VITE_API_TARGET || "https://meydone-production.up.railway.app/api";

  // Eğer adresin sonunda slash varsa onu uçur (garantiye alalım)
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }

  // Şimdi gönül rahatlığıyla sadece tek bir slash ile rotaları ekleyebiliriz
  return baseURL; 
};


// ... geri kalan api.interceptors kısımları tamamen aynı kalabilir
const api = axios.create({
  baseURL: getBaseURL().endsWith('/') ? getBaseURL() : `${getBaseURL()}/`,// Fonksiyonu burada çağırıyoruz
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Mevcut mantığın: Baştaki slash'ı temizle
    if (typeof config.url === 'string' && config.url.startsWith('/')) {
      config.url = config.url.slice(1);
    }
    // FormData kontrolü
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Token ekleme
    const token =
      typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

function extractApiMessage(status, data) {
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.join('. ');
  }
  if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
    return `Sunucu HTML döndü (HTTP ${status}). Genelde API kapalı veya yanlış adrestir.`;
  }
  if (status === 502 || status === 503 || status === 504) {
    return `API’ye ulaşılamıyor (HTTP ${status}). Backend’i başlatın.`;
  }
  if (status) {
    return `İstek başarısız (HTTP ${status}).`;
  }
  return null;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const message = !error.response
      ? 'Sunucuya bağlanılamadı. Backend ve MongoDB açık mı? IP adresiniz değişmiş olabilir.'
      : extractApiMessage(status, data) || 'İstek başarısız oldu';

    const enriched = Object.assign(error, {
      apiMessage: message,
      apiStatus: status,
    });

    if (import.meta.env.DEV) {
      console.error('[API]', status ?? 'NO_RESPONSE', message, data ?? error);
    }

    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    return Promise.reject(enriched);
  },
);

export default api;