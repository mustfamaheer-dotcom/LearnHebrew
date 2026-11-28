import { Router } from 'express';
import {
  listTemplatesHandler,
  getTemplateByIdHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  listCatalogHandler,
  assignTemplateHandler,
  getHomeworkSolveHandler,
  submitInteractiveHandler,
  listHomeworkHandler,
  createHomeworkHandler,
  submitHomeworkHandler,
  reviewHomeworkHandler,
} from './homework.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// 1. Admin Template Bank Management (Admin only)
router.get('/templates', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), listTemplatesHandler);
router.post('/templates', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), createTemplateHandler);
router.get('/templates/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), getTemplateByIdHandler);
router.put('/templates/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), updateTemplateHandler);
router.delete('/templates/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), deleteTemplateHandler);

// 2. Teacher Catalog & Assignment (Teachers & Admins)
router.get('/catalog', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER), listCatalogHandler);
router.post('/assign-template', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER), assignTemplateHandler);

// 3. Student Solve & Interactive Submission
router.get('/:id/solve', requireRoles(Role.STUDENT, Role.SUPER_ADMIN, Role.ADMIN), getHomeworkSolveHandler);
router.post('/:id/submit-interactive', requireRoles(Role.STUDENT), submitInteractiveHandler);

// 4. General / Legacy Homework Endpoints
router.get('/', listHomeworkHandler);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER), createHomeworkHandler);
router.patch('/:id/submit', submitHomeworkHandler);
router.patch('/:id/review', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER), reviewHomeworkHandler);

export default router;
