import { Router } from 'express';
import {
  listTeachersHandler,
  getTeacherHandler,
  getTeacherCalendarHandler,
  getTeacherSlotsHandler,
  addTeacherSlotHandler,
  deleteTeacherSlotHandler,
  getTeacherStudentsHandler,
} from './teachers.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public teacher directory & slots
router.get('/', listTeachersHandler);
router.get('/:id', getTeacherHandler);
router.get('/:id/slots', getTeacherSlotsHandler);

// Protected routes (teacher private schedule, slot mutations, and students)
router.use(authenticate);
router.get('/:id/calendar', getTeacherCalendarHandler);
router.post('/:id/slots', addTeacherSlotHandler);
router.delete('/:id/slots/:slotId', deleteTeacherSlotHandler);
router.get('/:id/students', getTeacherStudentsHandler);

export default router;

