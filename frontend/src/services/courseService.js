import api, { unwrap } from '../api/client';

export const courseService = {
  list: (params) => unwrap(api.get('/courses', { params })),
  get: (id) => unwrap(api.get(`/courses/${id}`)),
  content: (id) => unwrap(api.get(`/courses/${id}/content`)),
  create: (payload) => unwrap(api.post('/courses', payload)),
  update: (id, payload) => unwrap(api.put(`/courses/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/courses/${id}`)),
  students: (id) => unwrap(api.get(`/courses/${id}/students`)),
  quizAttempts: (id) => unwrap(api.get(`/courses/${id}/quiz-attempts`)),
};
