import { Router } from 'express';
import { deleteLesson, getLesson, updateLesson } from '../controllers/lessonController.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import { mongoIdParam } from '../validators/common.js';
import { updateLessonRules } from '../validators/curriculumValidators.js';

const router = Router();
const manager = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);

router.use(protect);

router.get('/:id', mongoIdParam('id'), validate, getLesson);
router.put('/:id', manager, mongoIdParam('id'), updateLessonRules, validate, updateLesson);
router.delete('/:id', manager, mongoIdParam('id'), validate, deleteLesson);

export default router;
