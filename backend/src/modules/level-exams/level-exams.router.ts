import { Router } from 'express';
import * as controller from './level-exams.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, controller.listExams);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.createExam);
router.post(
  '/:examId/open/:studentId',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  controller.openExam
);
router.get('/my-exams', authenticate, controller.getMyExams);
router.post('/:id/submit', authenticate, controller.submitExam);
router.post('/:id/reset', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.adminReset);

export default router;
