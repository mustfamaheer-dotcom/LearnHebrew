import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as feedbackService from './feedback.service';
import { AuthRequest } from '../../middleware/auth';

const lessonFeedbackSchema = z.object({
  qualityRating: z.number().int().min(1).max(5),
  difficulty: z.number().int().min(1).max(5),
  paceRating: z.number().int().min(1).max(5),
  comments: z.string().optional(),
});

const teacherSurveySchema = z.object({
  communication: z.number().int().min(1).max(5),
  knowledge: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  comments: z.string().optional(),
});

export async function submitLessonFeedbackHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = lessonFeedbackSchema.parse(req.body);
    const feedback = await feedbackService.submitLessonFeedback(
      req.params.lessonId,
      req.user!.userId,
      data
    );
    res.status(201).json({ feedback, message: 'Feedback submitted' });
  } catch (error) {
    next(error);
  }
}

export async function getLessonFeedbackHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const feedback = await feedbackService.getLessonFeedback(req.params.lessonId);
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
}

export async function submitTeacherSurveyHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = teacherSurveySchema.parse(req.body);
    const survey = await feedbackService.submitTeacherSurvey(
      req.params.teacherId,
      req.user!.userId,
      data
    );
    res.status(201).json({ survey, message: 'Teacher survey submitted' });
  } catch (error) {
    next(error);
  }
}

export async function listTeacherSurveysHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const teacherId = req.query.teacherId as string | undefined;
    const surveys = await feedbackService.listTeacherSurveys(teacherId);
    res.json({ surveys });
  } catch (error) {
    next(error);
  }
}

