import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as studentsService from './students.service';
import { AuthRequest } from '../../middleware/auth';
import { HebrewLevel } from '@prisma/client';

const updateLevelSchema = z.object({
  level: z.nativeEnum(HebrewLevel),
});

export async function listStudentsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const students = await studentsService.listStudents();
    res.json({ students });
  } catch (error) {
    next(error);
  }
}

export async function getStudentHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.getStudentById(req.params.id);
    res.json({ student });
  } catch (error) {
    next(error);
  }
}

export async function updateStudentLevelHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateLevelSchema.parse(req.body);
    const student = await studentsService.updateStudentLevel(req.params.id, data.level);
    res.json({ student });
  } catch (error) {
    next(error);
  }
}

export async function getStudentDashboardHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dashboard = await studentsService.getStudentDashboard(req.params.id);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

export async function getStudentLessonsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const lessons = await studentsService.getStudentLessons(req.params.id);
    res.json({ lessons });
  } catch (error) {
    next(error);
  }
}

export async function getStudentPackagesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const packages = await studentsService.getStudentPackages(req.params.id);
    res.json({ packages });
  } catch (error) {
    next(error);
  }
}

export async function getStudentPointsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pointsData = await studentsService.getStudentPoints(req.params.id);
    res.json(pointsData);
  } catch (error) {
    next(error);
  }
}

export async function getStudentHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const homework = await studentsService.getStudentHomework(req.params.id);
    res.json({ homework });
  } catch (error) {
    next(error);
  }
}

