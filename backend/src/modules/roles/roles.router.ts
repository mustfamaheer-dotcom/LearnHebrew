import { Router } from 'express';
import * as controller from './roles.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/matrix', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.getMatrix);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.createRole);
router.put('/:id/permissions', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.updatePermissions);
router.delete('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.deleteRole);

export default router;
