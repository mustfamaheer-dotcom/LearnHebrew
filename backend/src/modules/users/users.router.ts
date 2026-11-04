import { Router } from 'express';
import {
  listUsersHandler,
  createUserHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  resetPasswordHandler,
} from './users.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, requireRoles(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/', listUsersHandler);
router.post('/', createUserHandler);
router.get('/:id', getUserHandler);
router.patch('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);
router.post('/:id/reset-password', resetPasswordHandler);

export default router;

