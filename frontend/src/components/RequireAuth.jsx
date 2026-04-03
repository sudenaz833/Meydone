import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { appRoutes } from '../utils/routes';

/**
 * Token yoksa giriş sayfasına yönlendirir; geldiği adres `state.from` ile saklanır.
 */
export default function RequireAuth() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to={appRoutes.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
