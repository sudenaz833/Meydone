import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { appRoutes } from '../utils/routes';

/** Bilinmeyen yol: oturum varsa anasayfa, yoksa giriş. */
export default function NotFoundRedirect() {
  return <Navigate to={isAuthenticated() ? appRoutes.home : appRoutes.login} replace />;
}
