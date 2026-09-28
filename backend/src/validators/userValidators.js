import { body } from 'express-validator';
import { passwordRules } from './common.js';

export const updateProfileRules = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2-60 characters'),
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be at most 500 characters'),
];

export const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  passwordRules(body('newPassword')),
];
