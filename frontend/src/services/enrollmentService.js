import api, { unwrap } from '../api/client';

export const enrollmentService = {
  enroll: (courseId) => unwrap(api.post(`/courses/${courseId}/enroll`)),
  mine: () => unwrap(api.get('/enrollments/me')),
  get: (courseId) => unwrap(api.get(`/enrollments/${courseId}`)),
  completeLesson: (courseId, lessonId) =>
    unwrap(api.post(`/enrollments/${courseId}/lessons/${lessonId}/complete`)),
};
