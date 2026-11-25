import { Router } from 'express';
import * as controller from './placement-test.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { placementTestLimiter } from '../../middleware/rateLimiter';
import { Role } from '@prisma/client';

const router = Router();

// ==========================================
// Public Endpoints (Accessible for candidates with rate limiting)
// ==========================================
router.get('/config', controller.getPublicQuestions);
router.post('/check-eligibility', placementTestLimiter, controller.checkEligibility);
router.post('/check-answer', controller.checkAnswer);
router.post('/submit', placementTestLimiter, controller.submitTest);

// ==========================================
// Administrative Endpoints (Admin & Super Admin)
// ==========================================
router.get(
  '/submissions',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.listSubmissions
);

router.get(
  '/submissions/:id',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.getSubmission
);

router.post(
  '/submissions/:id/allow-retake',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.allowRetake
);

router.post(
  '/submissions/:id/convert-to-student',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.convertToStudent
);

router.get(
  '/questions',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.getAdminQuestions
);

router.post(
  '/questions',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.saveQuestion
);

router.put(
  '/questions/:id',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.saveQuestion
);

router.delete(
  '/questions/:id',
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  controller.deleteQuestion
);

export default router;
