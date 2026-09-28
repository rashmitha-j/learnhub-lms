import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, message, action, compact = false }) {
  return (
    <div className={`state-box ${compact ? 'state-compact' : ''}`}>
      <span className="state-icon">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  );
}
