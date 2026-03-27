import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { layoutShell, mainContent } from "../utils/ui";

const APP_NAME = "Meydone";

function documentTitleForPath(pathname) {
  if (pathname === "/") return `${APP_NAME} — Anasayfa`;
  if (pathname === "/venues") return `${APP_NAME} — Mekanlar`;
  if (pathname.startsWith("/venues/")) return `${APP_NAME} — Mekan`;
  if (pathname === "/login") return `${APP_NAME} — Giriş`;
  if (pathname === "/register") return `${APP_NAME} — Üye ol`;
  if (pathname === "/profile") return `${APP_NAME} — Profil`;
  if (pathname === "/friends") return `${APP_NAME} — Arkadaşlar`;
  if (pathname === "/admin") return `${APP_NAME} — Yönetim`;
  if (pathname === "/404") return `${APP_NAME} — Sayfa bulunamadı`;
  return APP_NAME;
}

export default function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    document.title = documentTitleForPath(location.pathname);
  }, [location.pathname]);

  return (
    <div className={`${layoutShell} flex min-h-screen flex-col`}>
      <AppHeader />
      <main className={mainContent}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
