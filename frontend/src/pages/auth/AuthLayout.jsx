import { CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

// Two-column card used by the login and register pages.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side" aria-hidden="true">
          <span className="brand-mark brand-mark-lg">L</span>
          <h2>{APP_NAME}</h2>
          <p>Learn in-demand skills with structured courses, quizzes and progress tracking.</p>
          <ul>
            <li>
              <CheckCircle2 size={16} /> Free courses from real instructors
            </li>
            <li>
              <CheckCircle2 size={16} /> Resume right where you left off
            </li>
            <li>
              <CheckCircle2 size={16} /> Instant quiz feedback
            </li>
          </ul>
        </div>
        <div className="auth-form-wrap">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
