import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, requireRoles, AuthRequest } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate, requireRoles(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/overview', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalPackages,
      activePackages,
      totalLessons,
      completedLessons,
      scheduledLessons,
      cancelledLessons,
      recentFeedbacks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.package.count(),
      prisma.studentPackage.count({ where: { status: 'ACTIVE' } }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { status: 'COMPLETED' } }),
      prisma.lesson.count({ where: { status: 'SCHEDULED' } }),
      prisma.lesson.count({ where: { status: 'CANCELLED' } }),
      prisma.lessonFeedback.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: { include: { user: true } },
          lesson: { include: { teacher: { include: { user: true } } } },
        },
      }),
    ]);

    const completionRate =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalPackages,
      activePackages,
      totalLessons,
      completedLessons,
      scheduledLessons,
      cancelledLessons,
      completionRate,
      recentFeedbacks,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

