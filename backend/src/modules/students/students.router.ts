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
} from './students.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listStudentsHandler);
router.get('/:id', getStudentHandler);
router.patch('/:id/level', updateStudentLevelHandler);
router.get('/:id/dashboard', getStudentDashboardHandler);
router.get('/:id/lessons', getStudentLessonsHandler);
router.get('/:id/packages', getStudentPackagesHandler);
router.get('/:id/points', getStudentPointsHandler);
router.get('/:id/homework', getStudentHomeworkHandler);

export default router;

