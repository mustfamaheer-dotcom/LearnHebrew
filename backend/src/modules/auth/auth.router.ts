import { Router } from 'express';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler,
  meHandler,
} from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.post('/change-password', authenticate, changePasswordHandler);
router.get('/me', authenticate, meHandler);

export default router;

