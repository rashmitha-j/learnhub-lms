// 95 -> "1h 35m", 40 -> "40m", 0 -> "0m"
export const formatDuration = (minutes = 0) => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

export const pluralize = (count, word, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`;

// Maps an enrollment to a StatusBadge status.
export const enrollmentStatus = (enrollment) => {
  if (enrollment.completed) return 'completed';
  return enrollment.progress > 0 ? 'in-progress' : 'not-started';
};

export const initials =(name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
