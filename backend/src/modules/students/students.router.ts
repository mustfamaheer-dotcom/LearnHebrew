import { Router } from 'express';
import {
  listStudentsHandler,
  getStudentHandler,
  updateStudentLevelHandler,
  getStudentDashboardHandler,
  getStudentLessonsHandler,
  getStudentPackagesHandler,
  getStudentPointsHandler,
  getStudentHomeworkHandler,
  getStudentTransactionsHandler,
  getStudentProgressHandler,
} from './students.controller';
import { authenticate } from '../../middleware/auth';
import { validateUuidParam } from '../../middleware/validateUuid';
import { authorizeStudentAccess } from '../../middleware/ownership';

const router = Router();

router.use(authenticate);

// List all students (Admin/Teacher restricted inside controller/service)
router.get('/', listStudentsHandler);

// Single student operations guarded by UUID validation & IDOR ownership verification
router.get('/:id', validateUuidParam('id'), authorizeStudentAccess, getStudentHandler);
router.patch('/:id/level', validateUuidParam('id'), authorizeStudentAccess, updateStudentLevelHandler);
router.get('/:id/dashboard', validateUuidParam('id'), authorizeStudentAccess, getStudentDashboardHandler);
router.get('/:id/progress', validateUuidParam('id'), authorizeStudentAccess, getStudentProgressHandler);
router.get('/:id/lessons', validateUuidParam('id'), authorizeStudentAccess, getStudentLessonsHandler);
router.get('/:id/packages', validateUuidParam('id'), authorizeStudentAccess, getStudentPackagesHandler);
router.get('/:id/points', validateUuidParam('id'), authorizeStudentAccess, getStudentPointsHandler);
router.get('/:id/homework', validateUuidParam('id'), authorizeStudentAccess, getStudentHomeworkHandler);
router.get('/:id/transactions', validateUuidParam('id'), authorizeStudentAccess, getStudentTransactionsHandler);

export default router;
