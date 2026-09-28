import { body } from 'express-validator';

const quizRules = (partial) => {
  const field = (name) => (partial ? body(name).optional() : body(name));

  return [
    field('title')
      .isString()
      .trim()
      .isLength({ min: 3, max: 120 })
      .withMessage('Quiz title must be 3-120 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    body('section').optional({ values: 'null' }).isMongoId().withMessage('Invalid section'),
    body('passingScore')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Passing score must be 0-100')
      .toInt(),
    field('questions')
      .isArray({ min: 1, max: 50 })
      .withMessage('A quiz needs between 1 and 50 questions'),
    body('questions.*.question')
      .isString()
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage('Each question must be 3-1000 characters'),
    body('questions.*.options')
      .isArray({ min: 2, max: 6 })
      .withMessage('Each question needs 2-6 options'),
    body('questions.*.options.*')
      .isString()
      .trim()
      .isLength({ min: 1, max: 300 })
      .withMessage('Options must be 1-300 characters'),
    body('questions.*.correctAnswer')
      .isInt({ min: 0 })
      .withMessage('Each question needs a correct answer')
      .toInt(),
    body('questions.*').custom((q) => {
      if (Array.isArray(q?.options) && Number(q.correctAnswer) >= q.options.length) {
        throw new Error('Correct answer must match one of the options');
      }
      return true;
    }),
  ];
};

export const createQuizRules = quizRules(false);
export const updateQuizRules = quizRules(true);

export const submitQuizRules = [
  body('answers').isArray({ max: 100 }).withMessage('answers must be a list'),
  body('answers.*.questionId').isMongoId().withMessage('Invalid question id'),
  body('answers.*.selectedOption')
    .optional({ values: 'null' })
    .isInt({ min: 0 })
    .withMessage('selectedOption must be a non-negative integer')
    .toInt(),
];
