import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import VenuesPage from "./pages/VenuesPage";
import VenueDetailPage from "./pages/VenueDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import FriendProfilePage from "./pages/FriendProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import { appRoutes } from "./utils/routes";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={appRoutes.home} element={<HomePage />} />
        <Route path={appRoutes.venues} element={<VenuesPage />} />
        <Route path={appRoutes.venueDetail} element={<VenueDetailPage />} />
        <Route path={appRoutes.login} element={<LoginPage />} />
        <Route path={appRoutes.register} element={<RegisterPage />} />
        <Route path={appRoutes.profile} element={<ProfilePage />} />
        <Route path={appRoutes.friends} element={<FriendsPage />} />
        <Route path={appRoutes.friendProfile} element={<FriendProfilePage />} />
        <Route path={appRoutes.admin} element={<AdminDashboardPage />} />
        <Route path="/404" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
