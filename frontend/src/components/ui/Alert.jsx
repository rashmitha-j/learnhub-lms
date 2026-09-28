import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export default function Alert({ tone = 'info', children, onClose }) {
  if (!children) return null;
  const Icon = ICONS[tone] || Info;

  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div className="alert-body">{children}</div>
      {onClose && (
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
