import { Router } from 'express';
import * as controller from './point-rules.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, controller.listRules);
router.put('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.updateRule);

export default router;
