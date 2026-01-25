import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, isAdmin as checkIsAdmin } from '../services/auth';

const isAdmin = () => {
  return isAuthenticated() && checkIsAdmin();
};

export const PublicRoute = () => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export const RootRedirect = () => {
  return <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />;
};
