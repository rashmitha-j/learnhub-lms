import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { pick } from '../utils/helpers.js';

// Email and role are intentionally not editable here.
export const updateProfile = async (req, res) => {
  const updates = pick(req.body, ['name', 'bio']);
  Object.assign(req.user, updates);
  await req.user.save();

  sendSuccess(res, { message: 'Profile updated', data: { user: req.user } });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, { message: 'Password updated' });
};
