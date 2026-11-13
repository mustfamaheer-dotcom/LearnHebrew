import { Router } from 'express';
import * as controller from './session-types.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', controller.listSessionTypes);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.createSessionType);
router.put('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.updateSessionType);
router.delete('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.deleteSessionType);

export default router;
