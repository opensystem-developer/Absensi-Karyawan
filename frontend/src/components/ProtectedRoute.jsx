import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, permission }) {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission, '*')) return <Navigate to="/" replace />;
  return children || <Outlet />;
}
