import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as teachersService from './teachers.service';
import { AuthRequest } from '../../middleware/auth';
import { SlotType } from '@prisma/client';

const addSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be in HH:MM format').optional(),
  durationMinutes: z.number().int().optional(),
  slotType: z.nativeEnum(SlotType).optional(),
  zoomLink: z.string().min(5, 'Zoom meeting link is required for availability slots'),
  saveAsDefault: z.boolean().optional(),
});

export async function listTeachersHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const teachers = await teachersService.listTeachers();
    res.json({ teachers });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const teacher = await teachersService.getTeacherById(req.params.id);
    res.json({ teacher });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherCalendarHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const calendar = await teachersService.getTeacherCalendar(req.params.id);
    res.json(calendar);
  } catch (error) {
    next(error);
  }
}

export async function getTeacherSlotsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const slots = await teachersService.getTeacherSlots(req.params.id);
    res.json({ slots });
  } catch (error) {
    next(error);
  }
}

export async function addTeacherSlotHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = addSlotSchema.parse(req.body);
    const slot = await teachersService.addSlot(req.params.id, data);
    res.status(201).json({ slot });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacherSlotHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await teachersService.deleteSlot(req.params.slotId);
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherStudentsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const students = await teachersService.getTeacherStudents(req.params.id);
    res.json({ students });
  } catch (error) {
    next(error);
  }
}

