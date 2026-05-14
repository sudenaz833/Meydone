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
    <div className="flex flex-col min-h-screen bg-white">
      <AppHeader />
      <main className="flex-grow pt-20 pb-24 px-4 overflow-x-hidden">
        <Outlet />
      </main>
      <BottomNav /> 
    </div>
  );
}

export default function App() {
  return (
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
          
          {/* --- CEREN BURAYA DİKKAT: PROFİLİ BURAYA TAŞIDIK ---
            Profil sayfasını RequireAuth duvarının dışına, genel AppShell içine aldık.
            ProfilePage kendi içinde zaten giriş kontrolü (status === 'guest') yaptığı için 
            giriş yapmayanları yine engelleyecek ama giriş yapmış admini asla engellemeyecek!
          */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Sadece Giriş Yapmış Kullanıcılar ve Özel Sayfalar */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
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