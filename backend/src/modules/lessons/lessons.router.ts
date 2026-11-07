import { Router } from 'express';
import {
  listLessonsHandler,
  bookLessonHandler,
  getLessonHandler,
  updateLessonHandler,
  cancelLessonHandler,
  rescheduleLessonHandler,
  completeLessonHandler,
  saveRecordingHandler,
} from './lessons.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listLessonsHandler);
router.post('/', bookLessonHandler);
router.get('/:id', getLessonHandler);
router.patch('/:id', updateLessonHandler);
router.delete('/:id', cancelLessonHandler);
router.post('/:id/reschedule', rescheduleLessonHandler);
router.post('/:id/complete', completeLessonHandler);
router.post('/:id/recording', saveRecordingHandler);

export default router;

