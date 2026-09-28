import { Router } from 'express';
import {
  deleteQuiz,
  getMyAttempts,
  getQuiz,
  getQuizResults,
  submitQuiz,
  updateQuiz,
} from '../controllers/quizController.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import { mongoIdParam } from '../validators/common.js';
import { submitQuizRules, updateQuizRules } from '../validators/quizValidators.js';

export const quizRouter = Router();
const manager = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);

quizRouter.use(protect);

quizRouter.get('/:id', mongoIdParam('id'), validate, getQuiz);
quizRouter.put('/:id', manager, mongoIdParam('id'), updateQuizRules, validate, updateQuiz);
quizRouter.delete('/:id', manager, mongoIdParam('id'), validate, deleteQuiz);
quizRouter.post(
  '/:id/submit',
  authorize(ROLES.STUDENT),
  mongoIdParam('id'),
  submitQuizRules,
  validate,
  submitQuiz
);
quizRouter.get('/:id/results', mongoIdParam('id'), validate, getQuizResults);

export const quizAttemptRouter = Router();

quizAttemptRouter.get('/me', protect, authorize(ROLES.STUDENT), getMyAttempts);
