const STATUSES = {
  published: ['success', 'Published'],
  draft: ['neutral', 'Draft'],
  completed: ['success', 'Completed'],
  'in-progress': ['info', 'In progress'],
  'not-started': ['neutral', 'Not started'],
  passed: ['success', 'Passed'],
  failed: ['danger', 'Failed'],
  student: ['info', 'Student'],
  instructor: ['purple', 'Instructor'],
  admin: ['warning', 'Admin'],
};

// Use `status` for known states, or `tone` + children for anything else.
export default function StatusBadge({ status, tone, children }) {
  const [statusTone, statusLabel] = STATUSES[status] || ['neutral', status];
  return <span className={`badge badge-${tone || statusTone}`}>{children || statusLabel}</span>;
}
