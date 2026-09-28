export default function StatCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  return (
    <div className="stat-card">
      {Icon && (
        <span className={`stat-icon tone-${tone}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}
