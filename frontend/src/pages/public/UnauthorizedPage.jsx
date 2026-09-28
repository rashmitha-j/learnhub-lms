import { ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { homePathFor } from '../../utils/constants';

export default function UnauthorizedPage() {
  useDocumentTitle('Access denied');
  const { user } = useAuth();

  return (
    <div className="container page page-center">
      <EmptyState
        icon={ShieldAlert}
        title="You don’t have access to this page"
        message={
          user
            ? `This area isn’t available for ${user.role} accounts.`
            : 'Please log in with an account that has access.'
        }
        action={<Button to={homePathFor(user)}>{user ? 'Go to my dashboard' : 'Log in'}</Button>}
      />
    </div>
  );
}
