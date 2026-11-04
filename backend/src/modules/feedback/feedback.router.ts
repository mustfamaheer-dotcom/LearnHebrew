import { Router } from 'express';
import {
  submitLessonFeedbackHandler,
  getLessonFeedbackHandler,
  submitTeacherSurveyHandler,
  listTeacherSurveysHandler,
} from './feedback.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/lesson/:lessonId', submitLessonFeedbackHandler);
router.get('/lesson/:lessonId', getLessonFeedbackHandler);
router.post('/survey/:teacherId', submitTeacherSurveyHandler);
router.get('/surveys', listTeacherSurveysHandler);

export default router;

