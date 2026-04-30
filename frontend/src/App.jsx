import { Routes, Route, Outlet } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import AppHeader from './components/AppHeader';
import RequireAuth from './components/RequireAuth';
import GuestOnly from './components/GuestOnly';
import NotFoundRedirect from './components/NotFoundRedirect';
import HomePage from './pages/HomePage';
import VenuesListPage from './pages/VenuesListPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VenueDetailPage from './pages/VenueDetailPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import FriendProfilePage from './pages/FriendProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function AppShell() {
  return (
    // min-h-screen ve flex-col: İçeriği dikeyde tam yayar
    <div className="flex flex-col min-h-screen bg-white">
      <AppHeader />
      
      {/* 
          pt-20: Header'ın altında kalmaması için üst boşluk.
          pb-24: BottomNav'ın üstüne binmemesi için alt boşluk.
          overflow-x-hidden: Mobilde sağa sola gereksiz kaymaları engeller.
      */}
      <main className="flex-grow pt-20 pb-24 px-4 overflow-x-hidden">
        <Outlet />
      </main>

      <BottomNav /> 
    </div>
  );
}

export default function App() {
  return (
    // viewport-fit=cover özelliğiyle uyumlu olması için arka planı buradan yönetiyoruz
    <div className="min-h-screen bg-white selection:bg-rose-100">
      <Routes>
        {/* Misafir Sayfaları (Giriş/Kayıt) */}
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Herkese Açık Sayfalar (Mobil Kabuk Dahil) */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mekanlar" element={<VenuesListPage />} />
          <Route path="/venues/:id" element={<VenueDetailPage />} />
        </Route>

        {/* Sadece Giriş Yapmış Kullanıcılar */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/friends/profile/:id" element={<FriendProfilePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </div>
  );
}