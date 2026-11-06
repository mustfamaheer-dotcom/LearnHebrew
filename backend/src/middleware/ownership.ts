import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

/**
 * Ensures that the authenticated user either owns the target student resource,
 * or possesses administrative privileges (ADMIN / SUPER_ADMIN).
 * Neutralizes Insecure Direct Object Reference (IDOR) attacks.
 */
export async function authorizeStudentAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins have universal platform access
    if (req.user.role === Role.ADMIN || req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    const targetStudentId = req.params.id || req.body?.studentId;
    if (!targetStudentId) {
      return next();
    }

    // Find the target student
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: targetStudentId }, { userId: targetStudentId }],
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // If caller is a student, ensure they own this record
    if (req.user.role === Role.STUDENT) {
      if (student.userId !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied: You are not authorized to view or modify this student profile.',
        });
      }
      return next();
    }

    // If caller is a teacher, allow access if they share lessons with this student
    if (req.user.role === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
        select: { id: true },
      });

      if (!teacher) {
        return res.status(403).json({ error: 'Teacher profile not found' });
      }

      const hasSharedLesson = await prisma.lesson.findFirst({
        where: {
          studentId: student.id,
          teacherId: teacher.id,
        },
        select: { id: true },
      });

      if (!hasSharedLesson) {
        return res.status(403).json({
          error: 'Access denied: This student is not assigned to your schedule.',
        });
      }

      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    next(error);
  }
}
