import { Router } from 'express';
import {
  submitLessonFeedbackHandler,
  getLessonFeedbackHandler,
  listLessonFeedbacksHandler,
  deleteLessonFeedbackHandler,
  submitTeacherSurveyHandler,
  listTeacherSurveysHandler,
  deleteTeacherSurveyHandler,
  getFeedbackAnalyticsHandler,
} from './feedback.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Lesson Feedback routes
router.get('/lessons', listLessonFeedbacksHandler);
router.post('/lesson/:lessonId', submitLessonFeedbackHandler);
router.get('/lesson/:lessonId', getLessonFeedbackHandler);
router.delete('/lesson/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), deleteLessonFeedbackHandler);

// Teacher Survey routes
router.get('/surveys', listTeacherSurveysHandler);
router.post('/survey/:teacherId', submitTeacherSurveyHandler);
router.delete('/survey/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), deleteTeacherSurveyHandler);

// Analytics
router.get('/analytics', getFeedbackAnalyticsHandler);

export default router;
