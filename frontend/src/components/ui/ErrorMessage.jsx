import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorMessage({ title = 'Something went wrong', message, onRetry, action }) {
  return (
    <div className="state-box state-error" role="alert">
      <span className="state-icon">
        <AlertTriangle size={24} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      <div className="state-actions">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
