import { body } from 'express-validator';
import { ALL_ROLES } from '../utils/constants.js';
import { passwordRules } from './common.js';

const emailRule = () =>
  body('email')
    .isString()
    .withMessage('Email is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 254 });

export const registerRules = [
  body('name')
    .isString()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2-60 characters'),
  emailRule(),
  passwordRules(body('password')),
  // Admin is rejected with 403 in the controller; anything else unknown is a 400
  body('role').optional().isIn(ALL_ROLES).withMessage('Role must be student or instructor'),
];

export const loginRules = [
  emailRule(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];
