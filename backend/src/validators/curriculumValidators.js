import { body } from 'express-validator';

const titleRule = (field) =>
  field.isString().trim().isLength({ min: 2, max: 120 }).withMessage('Title must be 2-120 characters');

export const createSectionRules = [titleRule(body('title'))];

export const updateSectionRules = [
  titleRule(body('title').optional()),
  body('order').optional().isInt({ min: 0 }).withMessage('order must be a non-negative integer').toInt(),
];

const idList = (field) => [
  body(field).isArray({ min: 1, max: 200 }).withMessage(`${field} must be a non-empty list`),
  body(`${field}.*`).isMongoId().withMessage(`${field} contains an invalid id`),
];

export const reorderSectionsRules = idList('sectionIds');
export const reorderLessonsRules = idList('lessonIds');

const lessonRules = (partial) => {
  const field = (name) => (partial ? body(name).optional() : body(name));
  return [
    titleRule(field('title')),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be at most 5000 characters'),
    field('videoUrl')
      .isString()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Video URL must be a valid http(s) URL'),
    body('duration')
      .optional()
      .isInt({ min: 0, max: 1440 })
      .withMessage('Duration must be 0-1440 minutes')
      .toInt(),
  ];
};

export const createLessonRules = lessonRules(false);
export const updateLessonRules = lessonRules(true);
