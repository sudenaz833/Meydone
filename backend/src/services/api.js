import axios from "axios";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const fallbackMessage =
      !error.response
        ? "Sunucuya bağlanılamadı. Lütfen interneti ve backend servisinin çalıştığını kontrol edin."
        : "İstek başarısız oldu";

    const message =
      (typeof data?.message === "string" && data.message) ||
      (Array.isArray(data?.errors) && data.errors.join(". ")) ||
      fallbackMessage;

    const enriched = Object.assign(error, {
      apiMessage: message,
      apiStatus: status,
    });

    if (import.meta.env.DEV) {
      console.error("[API]", status ?? "NO_RESPONSE", message, data ?? error);
    }

    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    return Promise.reject(enriched);
  },
);

export default api;
