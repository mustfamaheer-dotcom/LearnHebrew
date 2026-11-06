import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as homeworkService from './homework.service';
import { AuthRequest } from '../../middleware/auth';

const createHomeworkSchema = z.object({
  lessonId: z.string().optional(),
  studentId: z.string(),
  teacherId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
  dueDate: z.string().optional(),
});

const submitHomeworkSchema = z.object({
  studentNote: z.string().min(1),
});

const reviewHomeworkSchema = z.object({
  teacherFeedback: z.string().min(1),
});

export async function listHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const homework = await homeworkService.listHomework({
      studentId,
      teacherId,
      userRole: req.user?.role,
      userId: req.user?.userId,
    });
    res.json({ homework });
  } catch (error) {
    next(error);
  }
}

export async function createHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createHomeworkSchema.parse(req.body);
    const homework = await homeworkService.createHomework({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
    res.status(201).json({ homework });
  } catch (error) {
    next(error);
  }
}

export async function submitHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = submitHomeworkSchema.parse(req.body);
    const homework = await homeworkService.submitHomework(req.params.id, data.studentNote);
    res.json({ homework, message: 'Homework submitted (+20 points awarded!)' });
  } catch (error) {
    next(error);
  }
}

export async function reviewHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = reviewHomeworkSchema.parse(req.body);
    const homework = await homeworkService.reviewHomework(req.params.id, data.teacherFeedback);
    res.json({ homework, message: 'Homework reviewed successfully' });
  } catch (error) {
    next(error);
  }
}

