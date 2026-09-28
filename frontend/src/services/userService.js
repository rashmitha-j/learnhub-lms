import api, { unwrap } from '../api/client';

export const userService = {
  updateProfile: (payload) => unwrap(api.put('/users/me', payload)),
  changePassword: (payload) => unwrap(api.put('/users/me/password', payload)),
};
