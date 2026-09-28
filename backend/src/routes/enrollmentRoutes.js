import { Router } from 'express';
import {
  completeLesson,
  getEnrollment,
  getMyEnrollments,
} from '../controllers/enrollmentController.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import { mongoIdParam } from '../validators/common.js';

const router = Router();

router.use(protect, authorize(ROLES.STUDENT));

router.get('/me', getMyEnrollments);
router.get('/:courseId', mongoIdParam('courseId'), validate, getEnrollment);
router.post(
  '/:courseId/lessons/:lessonId/complete',
  mongoIdParam('courseId', 'lessonId'),
  validate,
  completeLesson
);

export default router;
