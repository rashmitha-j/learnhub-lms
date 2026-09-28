import api, { unwrap } from '../api/client';

export const sectionService = {
  create: (courseId, payload) => unwrap(api.post(`/courses/${courseId}/sections`, payload)),
  update: (id, payload) => unwrap(api.put(`/sections/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/sections/${id}`)),
  reorder: (courseId, sectionIds) =>
    unwrap(api.patch(`/courses/${courseId}/sections/reorder`, { sectionIds })),
};
