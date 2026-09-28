import api, { unwrap } from '../api/client';

export const adminService = {
  stats: () => unwrap(api.get('/admin/stats')),
  users: (params) => unwrap(api.get('/admin/users', { params })),
  courses: (params) => unwrap(api.get('/admin/courses', { params })),
  enrollments: (params) => unwrap(api.get('/admin/enrollments', { params })),
};
