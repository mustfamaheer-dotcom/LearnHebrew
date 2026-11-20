import { Router } from 'express';
import * as controller from './roles.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { Role } from '@prisma/client';

const router = Router();

router.get('/my-permissions', authenticate, controller.getMyPermissions);
router.get('/matrix', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), requirePermission('roles:manage'), controller.getMatrix);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), requirePermission('roles:manage'), controller.createRole);
router.put('/:id/permissions', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), requirePermission('roles:manage'), controller.updatePermissions);
router.delete('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), requirePermission('roles:manage'), controller.deleteRole);

export default router;
