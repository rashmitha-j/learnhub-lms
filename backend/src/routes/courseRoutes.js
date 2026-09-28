import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getCourse,
  getCourseContent,
  getCourseQuizAttempts,
  getCourseStudents,
  listCourses,
  updateCourse,
} from '../controllers/courseController.js';
import { createSection, reorderSections } from '../controllers/sectionController.js';
import { enroll } from '../controllers/enrollmentController.js';
import { createQuiz } from '../controllers/quizController.js';
import { authorize, optionalAuth, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import { mongoIdParam } from '../validators/common.js';
import { createCourseRules, listCoursesRules, updateCourseRules } from '../validators/courseValidators.js';
import { createSectionRules, reorderSectionsRules } from '../validators/curriculumValidators.js';
import { createQuizRules } from '../validators/quizValidators.js';

const router = Router();
const manager = [protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN)];

// Public catalog
router.get('/', listCoursesRules, validate, listCourses);
router.get('/:id', mongoIdParam('id'), validate, optionalAuth, getCourse);

// Enrolled students and course managers
router.get('/:id/content', protect, mongoIdParam('id'), validate, getCourseContent);

// Course management (ownership is checked in the controller)
router.post('/', manager, createCourseRules, validate, createCourse);
router.put('/:id', manager, mongoIdParam('id'), updateCourseRules, validate, updateCourse);
router.delete('/:id', manager, mongoIdParam('id'), validate, deleteCourse);

router.post('/:courseId/sections', manager, mongoIdParam('courseId'), createSectionRules, validate, createSection);
router.patch(
  '/:courseId/sections/reorder',
  manager,
  mongoIdParam('courseId'),
  reorderSectionsRules,
  validate,
  reorderSections
);
router.post('/:courseId/quizzes', manager, mongoIdParam('courseId'), createQuizRules, validate, createQuiz);
router.get('/:courseId/students', manager, mongoIdParam('courseId'), validate, getCourseStudents);
router.get('/:courseId/quiz-attempts', manager, mongoIdParam('courseId'), validate, getCourseQuizAttempts);

// Students
router.post('/:courseId/enroll', protect, authorize(ROLES.STUDENT), mongoIdParam('courseId'), validate, enroll);

export default router;
