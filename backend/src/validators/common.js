import { param, query } from 'express-validator';

export const mongoIdParam = (...names) =>
  names.map((name) => param(name).isMongoId().withMessage(`Invalid ${name}`));

export const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search is too long'),
];

// Shared password policy for registration and password changes.
export const passwordRules = (field) =>
  field
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');
