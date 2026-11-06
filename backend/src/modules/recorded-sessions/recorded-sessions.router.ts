import { Router } from 'express';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  listRecordedSessionsHandler,
  createRecordedSessionHandler,
  updateRecordedSessionHandler,
  deleteRecordedSessionHandler,
} from './recorded-sessions.controller';

const router = Router();

router.use(authenticate);

router.get('/', listRecordedSessionsHandler);
router.post(
  '/',
  requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  createRecordedSessionHandler
);
router.patch(
  '/:id',
  requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  updateRecordedSessionHandler
);
router.delete(
  '/:id',
  requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  deleteRecordedSessionHandler
);

export default router;

