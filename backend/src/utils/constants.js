export const ROLES = Object.freeze({
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
});

export const ALL_ROLES = Object.values(ROLES);

// Roles a user may choose at public registration. Admins are promoted manually.
export const PUBLIC_ROLES = [ROLES.STUDENT, ROLES.INSTRUCTOR];

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

export const COURSE_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
};
