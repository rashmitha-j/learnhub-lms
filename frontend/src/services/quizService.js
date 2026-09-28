import api, { unwrap } from '../api/client';

export const quizService = {
  create: (courseId, payload) => unwrap(api.post(`/courses/${courseId}/quizzes`, payload)),
  get: (id) => unwrap(api.get(`/quizzes/${id}`)),
  update: (id, payload) => unwrap(api.put(`/quizzes/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/quizzes/${id}`)),
  // answers: [{ questionId, selectedOption }] — the score is calculated by the server
  submit: (id, answers) => unwrap(api.post(`/quizzes/${id}/submit`, { answers })),
  results: (id) => unwrap(api.get(`/quizzes/${id}/results`)),
  myAttempts: () => unwrap(api.get('/quiz-attempts/me')),
};
