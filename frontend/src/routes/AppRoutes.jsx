import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AboutPage } from "../pages/AboutPage";
import { AdminPage } from "../pages/AdminPage";
import { AdminOnboardingPage } from "../pages/AdminOnboardingPage";
import { PageSkeleton } from "../components/Skeleton";
import { DriverDashboardPage } from "../pages/DriverDashboardPage";
import { DriverRidePage } from "../pages/DriverRidePage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RiderDashboardPage } from "../pages/RiderDashboardPage";
import { RiderRidePage } from "../pages/RiderRidePage";
import { RideHistoryPage } from "../pages/RideHistoryPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <Link className="brand" to="/">
        <img src="/assets/ride-booking-logo.svg" alt="Ride Booking" />
      </Link>
      <nav>
        <Link to="/about">About</Link>
        {user?.role === "rider" && <><Link to="/rider/dashboard">Rider Dashboard</Link><Link to="/rider/history">History</Link></>}
        {user?.role === "driver" && <><Link to="/driver/dashboard">Driver Dashboard</Link><Link to="/driver/history">History</Link></>}
        {user?.role === "admin" && <Link to="/admin/dashboard">Admin Dashboard</Link>}
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link className="nav-button" to="/register">
              Register
            </Link>
          </>
        ) : (
          <button className="link-button" type="button" onClick={logout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

function AppLayout({ children }) {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navigation />
        {children}
      </div>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSkeleton variant="session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (user && user.role !== role) return <Navigate to="/unauthorized" replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function RiderRoute({ children }) {
  return <RoleRoute role="rider">{children}</RoleRoute>;
}

export function DriverRoute({ children }) {
  return <RoleRoute role="driver">{children}</RoleRoute>;
}

export function AdminRoute({ children }) {
  return <RoleRoute role="admin">{children}</RoleRoute>;
}

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/onboarding" element={<AdminOnboardingPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route
          path="/rider/dashboard"
          element={
            <RiderRoute>
              <RiderDashboardPage />
            </RiderRoute>
          }
        />
        <Route path="/rider/rides/:rideId" element={<RiderRoute><RiderRidePage /></RiderRoute>} />
        <Route
          path="/rider/rides/:rideId"
          element={
            <RiderRoute>
              <RiderRidePage />
            </RiderRoute>
          }
        />
        <Route path="/rider/history" element={<RiderRoute><RideHistoryPage role="rider" /></RiderRoute>} />
        <Route
          path="/driver/dashboard"
          element={
            <DriverRoute>
              <DriverDashboardPage />
            </DriverRoute>
          }
        />
        <Route
          path="/driver/rides/:rideId"
          element={
            <DriverRoute>
              <DriverRidePage />
            </DriverRoute>
          }
        />
        <Route path="/driver/history" element={<DriverRoute><RideHistoryPage role="driver" /></DriverRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
