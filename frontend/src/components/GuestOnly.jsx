import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { appRoutes } from '../utils/routes';

/**
 * Zaten giriş yapılmışsa anasayfaya alır (login/register ekranları için).
 */
export default function GuestOnly() {
  if (isAuthenticated()) {
    return <Navigate to={appRoutes.home} replace />;
  }
  return <Outlet />;
}
