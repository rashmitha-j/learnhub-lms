import { Router } from 'express';
import { getMe } from '../controllers/authController.js';
import { changePassword, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { changePasswordRules, updateProfileRules } from '../validators/userValidators.js';

const router = Router();

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateProfileRules, validate, updateProfile);
router.put('/me/password', changePasswordRules, validate, changePassword);

export default router;
