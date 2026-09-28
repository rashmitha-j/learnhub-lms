import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { homePathFor } from '../../utils/constants';

// /dashboard -> the signed-in user's own dashboard
export default function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user)} replace />;
}
