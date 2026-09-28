import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import courseRoutes from './courseRoutes.js';
import sectionRoutes from './sectionRoutes.js';
import lessonRoutes from './lessonRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import { quizAttemptRouter, quizRouter } from './quizRoutes.js';
import instructorRoutes from './instructorRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/sections', sectionRoutes);
router.use('/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/quizzes', quizRouter);
router.use('/quiz-attempts', quizAttemptRouter);
router.use('/instructor', instructorRoutes);
router.use('/admin', adminRoutes);

export default router;
