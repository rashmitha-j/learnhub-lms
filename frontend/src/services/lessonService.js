import api, { unwrap } from '../api/client';

export const lessonService = {
  get: (id) => unwrap(api.get(`/lessons/${id}`)),
  create: (sectionId, payload) => unwrap(api.post(`/sections/${sectionId}/lessons`, payload)),
  update: (id, payload) => unwrap(api.put(`/lessons/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/lessons/${id}`)),
  reorder: (sectionId, lessonIds) =>
    unwrap(api.patch(`/sections/${sectionId}/lessons/reorder`, { lessonIds })),
};
