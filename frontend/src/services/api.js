import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

// 1. Dinamik IP Ayarı: Tarayıcı adresine göre karar veriyoruz
// ... diğer importlar aynı kalsın

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // 1. EĞER MOBİLDEYSEK (Capacitor ortamıysa) KESİNLİKLE CANLIYA GİT
    if (window.location.protocol === 'capacitor:') {
      return "https://meydone-production.up.railway.app/api";
    }

    // 2. Eğer web tarayıcısındaysak ve lokaldeysek Docker/Localhost'a git
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return "http://localhost:9000/api"; 
    }
  }

  // 3. Canlı web sitesi (Vercel) için
  return "https://meydone-production.up.railway.app/api";
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