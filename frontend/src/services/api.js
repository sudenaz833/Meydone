import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: "http://localhost:9000/api",
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof config.url === 'string' && config.url.startsWith('/')) {
      config.url = config.url.slice(1);
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
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
    return `API’ye ulaşılamıyor (HTTP ${status}). Backend’i başlatın: proje kökünde "npm run dev"; backend/.env PORT ile frontend/.env.development içindeki VITE_API_TARGET aynı olmalı.`;
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
      ? 'Sunucuya bağlanılamadı. Backend çalışıyor mu? Proje kökünde "npm run dev" veya ayrı terminalde backend klasöründe "npm run dev". MongoDB açık olmalı.'
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
