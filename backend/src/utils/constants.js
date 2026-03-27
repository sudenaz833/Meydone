/** Backend base URL (override with VITE_API_BASE_URL, e.g. http://localhost:5000/api) */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/** localStorage key for JWT (set this key when user logs in) */
export const AUTH_TOKEN_KEY = "token";

/** Seed / demo user (see backend seed.js) */
export const DEMO_LOGIN_EMAIL = "user@test.com";
export const DEMO_LOGIN_PASSWORD = "123456";
