import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './guards';

// Public pages
import HomePage             from '../pages/public/HomePage';
import HotelsPage           from '../pages/public/HotelsPage';
import HotelDetailPage      from '../pages/public/HotelDetailPage';
import BookingPage          from '../pages/public/BookingPage';
import BookingConfirmPage   from '../pages/public/BookingConfirmPage';
import RestaurantsPage      from '../pages/public/RestaurantsPage';
import RestaurantDetailPage from '../pages/public/RestaurantDetailPage';
import ReservationPage      from '../pages/public/ReservationPage';

// Auth pages
import LoginPage         from '../pages/auth/LoginPage';
import RegisterPage      from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// User dashboard pages
import DashboardHome           from '../pages/dashboard/DashboardHome';
import ProfilePage             from '../pages/dashboard/ProfilePage';
import MyHotelBookings         from '../pages/dashboard/MyHotelBookings';
import MyRestaurantReservations from '../pages/dashboard/MyRestaurantReservations';
import BookingDetailPage        from '../pages/dashboard/BookingDetailPage';

// Admin pages
import AdminOverview    from '../pages/admin/AdminOverview';
import AdminHotels      from '../pages/admin/AdminHotels';
import AdminRooms       from '../pages/admin/AdminRooms';
import AdminRestaurants from '../pages/admin/AdminRestaurants';
import AdminBookings    from '../pages/admin/AdminBookings';
import AdminUsers       from '../pages/admin/AdminUsers';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                       element={<HomePage />} />
      <Route path="/hotels"                 element={<HotelsPage />} />
      <Route path="/hotels/:id"             element={<HotelDetailPage />} />
      <Route path="/hotels/:id/book"        element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
      <Route path="/booking/confirm/:ref"   element={<ProtectedRoute><BookingConfirmPage /></ProtectedRoute>} />
      <Route path="/restaurants"            element={<RestaurantsPage />} />
      <Route path="/restaurants/:id"        element={<RestaurantDetailPage />} />
      <Route path="/restaurants/:id/reserve" element={<ProtectedRoute><ReservationPage /></ProtectedRoute>} />

      {/* Auth */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* User dashboard */}
      <Route path="/dashboard"             element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
      <Route path="/dashboard/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard/bookings"    element={<ProtectedRoute><MyHotelBookings /></ProtectedRoute>} />
      <Route path="/dashboard/reservations" element={<ProtectedRoute><MyRestaurantReservations /></ProtectedRoute>} />
      <Route path="/dashboard/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"             element={<AdminRoute><AdminOverview /></AdminRoute>} />
      <Route path="/admin/hotels"      element={<AdminRoute><AdminHotels /></AdminRoute>} />
      <Route path="/admin/rooms"       element={<AdminRoute><AdminRooms /></AdminRoute>} />
      <Route path="/admin/restaurants" element={<AdminRoute><AdminRestaurants /></AdminRoute>} />
      <Route path="/admin/bookings"    element={<AdminRoute><AdminBookings /></AdminRoute>} />
      <Route path="/admin/users"       element={<AdminRoute><AdminUsers /></AdminRoute>} />
    </Routes>
  );
}
