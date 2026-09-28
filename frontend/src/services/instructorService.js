import api, { unwrap } from '../api/client';

export const instructorService = {
  dashboard: () => unwrap(api.get('/instructor/dashboard')),
  courses: (params) => unwrap(api.get('/instructor/courses', { params })),
};
