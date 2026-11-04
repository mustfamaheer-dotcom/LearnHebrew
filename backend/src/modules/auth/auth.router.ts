import { Router } from 'express';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler,
  meHandler,
} from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.post('/change-password', authenticate, changePasswordHandler);
router.get('/me', authenticate, meHandler);

export default router;

