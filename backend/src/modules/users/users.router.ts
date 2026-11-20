import { Router } from 'express';
import {
  listUsersHandler,
  createUserHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  resetPasswordHandler,
  updateNotificationPreferencesHandler,
  getFamilyHandler,
  createChildHandler,
  linkFamilyHandler,
  unlinkFamilyHandler,
} from './users.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Dynamic RBAC permission-controlled endpoints
router.get('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES, Role.CS), requirePermission('users:view'), listUsersHandler);
router.post('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), requirePermission('users:create'), createUserHandler);
router.get('/:id', getUserHandler);
router.patch('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), requirePermission('users:edit'), updateUserHandler);
router.delete('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('users:delete'), deleteUserHandler);
router.post('/:id/reset-password', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('users:reset_password'), resetPasswordHandler);
router.put('/:id/notification-preferences', updateNotificationPreferencesHandler);

// Family / Parent & Child account management
router.get('/:id/family', getFamilyHandler);
router.post('/:id/children', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), requirePermission('users:create'), createChildHandler);
router.post('/:id/link-family', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), requirePermission('users:edit'), linkFamilyHandler);
router.delete('/:id/unlink-family', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), requirePermission('users:edit'), unlinkFamilyHandler);

export default router;
