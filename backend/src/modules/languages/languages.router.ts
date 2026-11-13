import { Router } from 'express';
import * as controller from './languages.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', controller.listLanguages);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.createLanguage);
router.patch('/:id/toggle', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.toggleLanguage);

export default router;
