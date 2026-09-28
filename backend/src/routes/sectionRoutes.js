import { Router } from 'express';
import { deleteSection, updateSection } from '../controllers/sectionController.js';
import { createLesson, reorderLessons } from '../controllers/lessonController.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import { mongoIdParam } from '../validators/common.js';
import {
  createLessonRules,
  reorderLessonsRules,
  updateSectionRules,
} from '../validators/curriculumValidators.js';

const router = Router();

router.use(protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));

router.put('/:id', mongoIdParam('id'), updateSectionRules, validate, updateSection);
router.delete('/:id', mongoIdParam('id'), validate, deleteSection);
router.post('/:sectionId/lessons', mongoIdParam('sectionId'), createLessonRules, validate, createLesson);
router.patch(
  '/:sectionId/lessons/reorder',
  mongoIdParam('sectionId'),
  reorderLessonsRules,
  validate,
  reorderLessons
);

export default router;
