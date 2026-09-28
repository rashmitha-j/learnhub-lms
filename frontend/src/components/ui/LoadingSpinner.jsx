export default function LoadingSpinner({ label = 'Loading…', fullPage = false, inline = false }) {
  return (
    <div className={`spinner-wrap ${fullPage ? 'spinner-full' : ''} ${inline ? 'spinner-inline' : ''}`} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className={inline ? 'sr-only' : 'muted'}>{label}</span>
    </div>
  );
}
