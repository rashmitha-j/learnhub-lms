import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import StatusBadge from '../ui/StatusBadge';
import { SIDEBAR_LINKS } from './navigation';

export default function Sidebar() {
  const { user } = useAuth();
  const links = SIDEBAR_LINKS[user?.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-user">
        <Avatar name={user?.name} size={40} />
        <div>
          <p className="sidebar-name">{user?.name}</p>
          <StatusBadge status={user?.role} />
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Dashboard">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
