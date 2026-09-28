import { Link } from 'react-router-dom';
import ApiStatus from '../ui/ApiStatus';
import { APP_NAME } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span>
            &copy; {new Date().getFullYear()} {APP_NAME}
          </span>
          <span className="muted">Learn at your own pace.</span>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/courses">Courses</Link>
          <Link to="/register">Become an instructor</Link>
        </nav>
        <ApiStatus />
      </div>
    </footer>
  );
}
