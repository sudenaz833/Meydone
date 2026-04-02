import { AUTH_TOKEN_KEY } from './constants';

/** Çıkış/giriş sonrası sayfaların yeniden okuması için */
export const AUTH_CHANGED_EVENT = 'meydone-auth-changed';

export function notifyAuthChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated() {
  const t = getAuthToken();
  return typeof t === 'string' && t.length > 0;
}
