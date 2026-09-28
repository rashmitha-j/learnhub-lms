export default function ProgressBar({ value = 0, label, showValue = true, size = 'md' }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={`progress progress-${size}`}>
      {(label || showValue) && (
        <div className="progress-meta">
          {label && <span>{label}</span>}
          {showValue && <span className="progress-value">{percent}%</span>}
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className={`progress-fill ${percent === 100 ? 'is-complete' : ''}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
