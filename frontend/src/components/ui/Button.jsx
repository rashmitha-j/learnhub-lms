import { Link } from 'react-router-dom';

// Renders a <Link> when `to` is set, an external <a> for `href`, otherwise a <button>.
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  block = false,
  icon: Icon,
  className = '',
  type = 'button',
  disabled,
  children,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    block && 'btn-block',
    !children && 'btn-icon-only',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
