import { Router } from 'express';
import multer from 'multer';
import * as controller from './payments.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { Role } from '@prisma/client';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

const router = Router();

router.get('/', authenticate, requirePermission('payments:view_all'), controller.listPayments);
router.post(
  '/',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SALES),
  requirePermission('payments:create'),
  upload.single('screenshot'),
  controller.createPayment
);
router.post('/:id/approve', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), requirePermission('payments:approve'), controller.approvePayment);
router.post('/:id/reject', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), requirePermission('payments:reject'), controller.rejectPayment);

export default router;
