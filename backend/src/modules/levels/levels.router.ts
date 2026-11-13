import { Router } from 'express';
import * as controller from './levels.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', controller.listLevels);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.createLevel);
router.put('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.updateLevel);
router.delete('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.deleteLevel);

export default router;
