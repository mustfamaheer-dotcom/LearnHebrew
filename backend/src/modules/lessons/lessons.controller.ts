import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as lessonsService from './lessons.service';
import { AuthRequest } from '../../middleware/auth';
import { SlotType, LessonStatus } from '@prisma/client';

const bookLessonSchema = z.object({
  studentId: z.string(),
  teacherId: z.string(),
  scheduledAt: z.string(),
  durationMinutes: z.number().int().optional(),
  timeSlotId: z.string().optional(),
  lessonType: z.nativeEnum(SlotType).optional(),
  zoomLink: z.string().optional(),
});

const updateLessonSchema = z.object({
  teacherNotes: z.string().optional(),
  recordingUrl: z.string().optional(),
  zoomLink: z.string().optional(),
  status: z.nativeEnum(LessonStatus).optional(),
});

const cancelLessonSchema = z.object({
  reason: z.string().optional(),
});

const rescheduleLessonSchema = z.object({
  newTimeSlotId: z.string().uuid(),
  newScheduledAt: z.string(),
});

export async function listLessonsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const status = req.query.status as LessonStatus | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const lessons = await lessonsService.listLessons({
      studentId,
      teacherId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userRole: req.user?.role,
      userId: req.user?.userId,
    });
    res.json({ lessons });
  } catch (error) {
    next(error);
  }
}

export async function bookLessonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = bookLessonSchema.parse(req.body);
    const lesson = await lessonsService.bookLesson({
      studentId: data.studentId,
      teacherId: data.teacherId,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes,
      timeSlotId: data.timeSlotId,
      lessonType: data.lessonType,
      zoomLink: data.zoomLink,
      bookedById: req.user!.userId,
    });
    res.status(201).json({ lesson });
  } catch (error) {
    next(error);
  }
}

export async function getLessonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getLessonById(req.params.id);
    res.json({ lesson });
  } catch (error) {
    next(error);
  }
}

export async function updateLessonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateLessonSchema.parse(req.body);
    const lesson = await lessonsService.updateLesson(req.params.id, data);
    res.json({ lesson });
  } catch (error) {
    next(error);
  }
}

export async function cancelLessonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = cancelLessonSchema.parse(req.body);
    const lesson = await lessonsService.cancelLesson(req.params.id, req.user!.userId, data.reason);
    res.json({ lesson, message: 'Lesson cancelled successfully' });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleLessonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = rescheduleLessonSchema.parse(req.body);
    const newLesson = await lessonsService.rescheduleLesson(
      req.params.id,
      req.user!.userId,
      data.newTimeSlotId,
      new Date(data.newScheduledAt)
    );
    res.json({ lesson: newLesson, message: 'Lesson rescheduled successfully' });
  } catch (error) {
    next(error);
  }
}

export async function completeLessonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.completeLesson(req.params.id);
    res.json({ lesson, message: 'Lesson marked as completed and points awarded' });
  } catch (error) {
    next(error);
  }
}

export async function saveRecordingHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const recordingUrl = z.string().url().parse(req.body.recordingUrl);
    const lesson = await lessonsService.saveRecording(req.params.id, recordingUrl);
    res.json({ lesson, message: 'Recording link saved' });
  } catch (error) {
    next(error);
  }
}

