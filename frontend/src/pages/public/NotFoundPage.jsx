import { Compass } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container page page-center">
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you are looking for does not exist or has been moved."
        action={
          <>
            <Button to="/">Back to home</Button>
            <Button to="/courses" variant="outline">
              Browse courses
            </Button>
          </>
        }
      />
    </div>
  );
}
