export const AUTH_TOKEN_KEY = 'meydone_token';

/** Vite proxy: `/api` → backend :4000. Production: set VITE_API_BASE_URL to full API root (…/api). */
//export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';



export const API_BASE_URL = import.meta.env.VITE_API_TARGET || "https://meydone-production.up.railway.app/api";