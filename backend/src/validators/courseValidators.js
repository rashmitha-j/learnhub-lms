import { body, query } from 'express-validator';
import { CATEGORIES, COURSE_SORTS, LEVELS } from '../utils/constants.js';
import { paginationQuery } from './common.js';

const stringList = (field, label) => [
  body(field).optional().isArray({ max: 20 }).withMessage(`${label} must be a list of at most 20 items`),
  body(`${field}.*`)
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage(`Each ${label.toLowerCase()} item must be 1-200 characters`),
];

// `partial` makes every field optional (for updates).
const courseRules = (partial) => {
  const field = (name) => (partial ? body(name).optional() : body(name));

  return [
    field('title')
      .isString()
      .trim()
      .isLength({ min: 5, max: 120 })
      .withMessage('Title must be 5-120 characters'),
    field('description')
      .isString()
      .trim()
      .isLength({ min: 20, max: 5000 })
      .withMessage('Description must be 20-5000 characters'),
    field('category').isIn(CATEGORIES).withMessage('Please choose a valid category'),
    field('level').isIn(LEVELS).withMessage('Level must be Beginner, Intermediate or Advanced'),
    body('thumbnail')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Thumbnail must be a valid http(s) URL'),
    ...stringList('requirements', 'Requirements'),
    ...stringList('learningOutcomes', 'Learning outcomes'),
    body('published').optional().isBoolean({ strict: true }).withMessage('published must be true or false'),
  ];
};

export const createCourseRules = courseRules(false);
export const updateCourseRules = courseRules(true);

export const listCoursesRules = [
  ...paginationQuery,
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  query('level').optional().isIn(LEVELS).withMessage('Invalid level'),
  query('instructor').optional().isMongoId().withMessage('Invalid instructor'),
  query('sort').optional().isIn(Object.keys(COURSE_SORTS)).withMessage('Invalid sort'),
  query('status').optional().isIn(['published', 'draft']).withMessage('status must be published or draft'),
];
