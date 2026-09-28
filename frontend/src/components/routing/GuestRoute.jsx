import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';
import { postLoginPath } from '../../utils/constants';

// Login/register pages: signed-in users are sent back to where they came from, or their dashboard.
export default function GuestRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingSpinner fullPage />;
  if (user) return <Navigate to={postLoginPath(user, location.state?.from)} replace />;

  return <Outlet />;
}
