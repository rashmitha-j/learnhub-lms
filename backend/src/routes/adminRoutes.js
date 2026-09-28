import { Router } from 'express';
import { query } from 'express-validator';
import { getStats, listCourses, listEnrollments, listUsers } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { ALL_ROLES, ROLES } from '../utils/constants.js';
import { paginationQuery } from '../validators/common.js';

const router = Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get('/stats', getStats);
router.get(
  '/users',
  paginationQuery,
  query('role').optional().isIn(ALL_ROLES).withMessage('Invalid role'),
  validate,
  listUsers
);
router.get(
  '/courses',
  paginationQuery,
  query('status').optional().isIn(['published', 'draft']).withMessage('Invalid status'),
  validate,
  listCourses
);
router.get('/enrollments', paginationQuery, validate, listEnrollments);

export default router;
