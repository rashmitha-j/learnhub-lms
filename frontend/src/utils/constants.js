export const APP_NAME = 'LearnHub';

export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
};

// Must match backend/src/utils/constants.js
export const CATEGORIES = [
  'Web Development',
  'Data Science',
  'Programming',
  'AI/ML',
  'Database',
  'Cloud',
  'Other',
];

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title (A–Z)' },
];

export const ROLE_HOME = {
  student: '/student/dashboard',
  instructor: '/instructor/dashboard',
  admin: '/admin/dashboard',
};

export const homePathFor = (user) => (user ? ROLE_HOME[user.role] || '/' : '/login');

// Where to go after login: back to the page that required it (router `from` location),
// unless it belongs to another role's area; otherwise the user's dashboard.
export const postLoginPath = (user, from) => {
  const area = from?.pathname?.split('/')[1];
  const allowed = from?.pathname && (!['student', 'instructor', 'admin'].includes(area) || area === user.role);
  return allowed ? `${from.pathname}${from.search || ''}` : homePathFor(user);
};
