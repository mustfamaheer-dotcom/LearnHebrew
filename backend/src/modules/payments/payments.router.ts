import { Router } from 'express';
import multer from 'multer';
import * as controller from './payments.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

const router = Router();

router.get('/', authenticate, controller.listPayments);
router.post(
  '/',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SALES),
  upload.single('screenshot'),
  controller.createPayment
);
router.post('/:id/approve', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.approvePayment);
router.post('/:id/reject', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.rejectPayment);

export default router;
