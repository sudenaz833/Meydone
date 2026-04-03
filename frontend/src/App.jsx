import { Routes, Route, Outlet } from 'react-router-dom';
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
    <>
      <AppHeader />
      <main className="pb-16">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/90 via-white to-white">
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mekanlar" element={<VenuesListPage />} />
          <Route path="/venues/:id" element={<VenueDetailPage />} />
        </Route>

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
