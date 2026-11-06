import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as recordedSessionsService from './recorded-sessions.service';
import { AuthRequest } from '../../middleware/auth';

const createSessionSchema = z.object({
  studentId: z.string().optional(),
  lessonId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  titleHe: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  sessionNumber: z.number().int().min(1).default(1),
  videoUrl: z.string().min(1, 'Video URL is required'),
  durationMinutes: z.number().int().positive().optional().default(25),
});

const updateSessionSchema = z.object({
  title: z.string().optional(),
  titleHe: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  sessionNumber: z.number().int().min(1).optional(),
  videoUrl: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  isPublished: z.boolean().optional(),
});

export async function listRecordedSessionsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const category = req.query.category as string | undefined;

    const sessions = await recordedSessionsService.listRecordedSessions({
      studentId,
      teacherId,
      category,
      userRole: req.user?.role,
      userId: req.user?.userId,
    });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function createRecordedSessionHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await recordedSessionsService.createRecordedSession({
      ...data,
      teacherUserId: req.user!.userId,
    });
    res.status(201).json({ session, message: 'Recorded session added successfully!' });
  } catch (error) {
    next(error);
  }
}

export async function updateRecordedSessionHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = updateSessionSchema.parse(req.body);
    const session = await recordedSessionsService.updateRecordedSession(req.params.id, data);
    res.json({ session, message: 'Recorded session updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecordedSessionHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await recordedSessionsService.deleteRecordedSession(req.params.id);
    res.json({ message: 'Recorded session deleted successfully' });
  } catch (error) {
    next(error);
  }
}

