import { Router } from 'express';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler,
  updateProfileHandler,
  meHandler,
} from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.post('/change-password', authenticate, changePasswordHandler);
router.patch('/profile', authenticate, updateProfileHandler);
router.get('/me', authenticate, meHandler);

export default router;

