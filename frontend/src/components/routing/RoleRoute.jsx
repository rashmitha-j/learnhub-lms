import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

// Requires a signed-in user whose role is in `roles`. The server enforces the same rules;
// this only controls what the UI shows.
export default function RoleRoute({ roles }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingSpinner fullPage label="Loading your account…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
