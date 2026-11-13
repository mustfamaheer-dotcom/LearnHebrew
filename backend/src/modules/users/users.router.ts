import { Router } from 'express';
import {
  listUsersHandler,
  createUserHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  resetPasswordHandler,
  updateNotificationPreferencesHandler,
} from './users.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Accessible by Admin and Sales/CS for student creation and search
router.get('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES, Role.CS), listUsersHandler);
router.post('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), createUserHandler);
router.get('/:id', getUserHandler);
router.patch('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), updateUserHandler);
router.delete('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), deleteUserHandler);
router.post('/:id/reset-password', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), resetPasswordHandler);
router.put('/:id/notification-preferences', updateNotificationPreferencesHandler);

export default router;
