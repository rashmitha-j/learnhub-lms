import { Router } from 'express';
import { getDashboard, getMyCourses } from '../controllers/instructorController.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import { listCoursesRules } from '../validators/courseValidators.js';

const router = Router();

router.use(protect, authorize(ROLES.INSTRUCTOR));

router.get('/dashboard', getDashboard);
router.get('/courses', listCoursesRules, validate, getMyCourses);

export default router;
