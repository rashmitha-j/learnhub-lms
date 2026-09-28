import { startTransition, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import { APP_NAME, ROLE_HOME } from '../../utils/constants';

const navLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

// Top-level links per role; the full list lives in the dashboard sidebar.
const ROLE_LINKS = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard' },
    { to: '/student/courses', label: 'My Learning' },
  ],
  instructor: [
    { to: '/instructor/dashboard', label: 'Dashboard' },
    { to: '/instructor/courses', label: 'My Courses', end: true },
  ],
  admin: [{ to: '/admin/dashboard', label: 'Admin' }],
};

const PROFILE_PATH = { student: '/student/profile', instructor: '/instructor/profile' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(location.pathname);
  const userMenuRef = useRef(null);

  // Close menus on navigation
  if (location.pathname !== menuPath) {
    setMenuPath(location.pathname);
    setMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setUserMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  // React Router navigations run as transitions; clearing the user in the same transition
  // commits both together, so route guards don't bounce the signed-out user to /login.
  const handleLogout = () => {
    startTransition(() => {
      navigate('/', { replace: true });
      logout();
    });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? ROLE_HOME[user.role] : '/'} className="brand">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          {APP_NAME}
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={menuOpen ? 'nav-menu open' : 'nav-menu'} aria-label="Main">
          {!user && (
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
          )}
          <NavLink to="/courses" end className={navLinkClass}>
            Courses
          </NavLink>
          {user &&
            ROLE_LINKS[user.role]?.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}

          {user ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <Avatar name={user.name} size={32} />
                <span className="user-menu-name">{user.name}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {userMenuOpen && (
                <div className="user-menu-panel" role="menu">
                  <div className="user-menu-header">
                    <strong>{user.name}</strong>
                    <span className="muted">{user.email}</span>
                    <span className="muted user-menu-role">{user.role}</span>
                  </div>
                  {PROFILE_PATH[user.role] && (
                    <Link to={PROFILE_PATH[user.role]} className="user-menu-item" role="menuitem">
                      <User size={16} /> Profile
                    </Link>
                  )}
                  <button type="button" className="user-menu-item" role="menuitem" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-actions">
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
