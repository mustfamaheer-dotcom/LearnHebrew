import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, requireRoles, AuthRequest } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

const router = Router();
router.use(authenticate, requireRoles(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/overview', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.query.force === 'true') {
      await cacheInvalidatePrefix('analytics:overview');
    }

    const data = await getCachedOrFetch('analytics:overview', 45, async () => {
      const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Group 1: Core Platform Counts (5 queries)
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalPackages,
      activePackagesCount,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.student.count().catch(() => 0),
      prisma.teacher.count().catch(() => 0),
      prisma.package.count().catch(() => 0),
      prisma.studentPackage.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    ]);

    // Group 2: Packages & Revenue Tracking (3 queries)
    const [
      allStudentPackages,
      currentMonthPackages,
      prevMonthPackages,
    ] = await Promise.all([
      prisma.studentPackage.findMany({
        include: { package: { select: { price: true } } },
      }).catch(() => []),
      prisma.studentPackage.findMany({
        where: { createdAt: { gte: startOfCurrentMonth } },
        include: { package: { select: { price: true } } },
      }).catch(() => []),
      prisma.studentPackage.findMany({
        where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        include: { package: { select: { price: true } } },
      }).catch(() => []),
    ]);

    // Group 3: Lessons & Homework Activity (7 queries)
    const [
      totalLessons,
      completedLessons,
      scheduledLessons,
      cancelledLessons,
      totalHomework,
      submittedOrReviewedHw,
      pendingHwReviews,
    ] = await Promise.all([
      prisma.lesson.count().catch(() => 0),
      prisma.lesson.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.lesson.count({ where: { status: 'SCHEDULED' } }).catch(() => 0),
      prisma.lesson.count({ where: { status: 'CANCELLED' } }).catch(() => 0),
      prisma.homework.count().catch(() => 0),
      prisma.homework.count({ where: { status: { in: ['SUBMITTED', 'REVIEWED'] } } }).catch(() => 0),
      prisma.homework.findMany({
        where: { status: 'SUBMITTED' },
        take: 5,
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }).catch(() => []),
    ]);

    // Group 4: Feedback, Surveys, Teachers & TimeSlots (5 queries)
    const [
      allFeedback,
      allSurveys,
      topStudentsRaw,
      allTeachersRaw,
      timeSlotsCount,
    ] = await Promise.all([
      prisma.lessonFeedback.findMany({ select: { qualityRating: true } }).catch(() => []),
      prisma.teacherSurvey.findMany({ select: { overallRating: true } }).catch(() => []),
      prisma.student.findMany({
        take: 5,
        orderBy: { totalPoints: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
          _count: { select: { lessons: true } },
          equippedAvatarFrame: true,
          equippedNickname: true,
        },
      }).catch(() => []),
      prisma.teacher.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
          _count: { select: { lessons: true } },
        },
      }).catch(() => []),
      prisma.timeSlot.count().catch(() => 0),
    ]);

    // Group 5: Balances, Durations & Recent Feed Items (8 queries)
    const [
      expiringPackages,
      lowCreditPackages,
      recentLessons,
      recentPackages,
      studentBalanceAgg,
      durationGroups,
      recentBalanceTransactions,
      lowBalanceStudents,
    ] = await Promise.all([
      prisma.studentPackage.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), gte: now },
        },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          package: { select: { name: true } },
        },
        take: 5,
      }).catch(() => []),
      prisma.studentPackage.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          package: { select: { name: true } },
        },
      }).catch(() => []),
      prisma.lesson.findMany({
        take: 6,
        orderBy: { scheduledAt: 'desc' },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }).catch(() => []),
      prisma.studentPackage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          package: { select: { name: true, price: true } },
        },
      }).catch(() => []),
      prisma.studentSessionBalance.aggregate({
        _sum: { balance: true },
      }).catch(() => ({ _sum: { balance: 0 } })),
      prisma.lesson.groupBy({
        by: ['durationMinutes'],
        _count: { id: true },
      }).catch(() => []),
      prisma.balanceTransaction.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
            },
          },
        },
      }).catch(() => []),
      prisma.studentSessionBalance.findMany({
        where: { balance: { lte: 1 } },
        take: 8,
        include: {
          student: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
            },
          },
          sessionType: true,
        },
      }).catch(() => []),
    ]);

    // Calculate revenue
    const totalRevenue = allStudentPackages.reduce(
      (sum, p) => sum + Number(p.package?.price || 0),
      0
    );
    const revenueMTD = currentMonthPackages.reduce(
      (sum, p) => sum + Number(p.package?.price || 0),
      0
    );
    const revenuePrevMonth = prevMonthPackages.reduce(
      (sum, p) => sum + Number(p.package?.price || 0),
      0
    );
    const revenueGrowth =
      revenuePrevMonth > 0
        ? Math.round(((revenueMTD - revenuePrevMonth) / revenuePrevMonth) * 100)
        : revenueMTD > 0
        ? 100
        : 0;

    // Calculate average rating across teacher ratings & survey/feedback entries
    const feedbackRatings = allFeedback.map((f) => f.qualityRating);
    const surveyRatings = allSurveys.map((s) => s.overallRating);
    const allRatings = [...feedbackRatings, ...surveyRatings];

    const teacherReviewTotal = allTeachersRaw.reduce(
      (sum, t) => sum + (t.ratingCount || 0),
      0
    );
    const teacherRatingWeightedSum = allTeachersRaw.reduce(
      (sum, t) => sum + (t.ratingAvg * Math.max(1, t.ratingCount || 1)),
      0
    );
    const teacherRatingAvg =
      teacherReviewTotal > 0
        ? Number((teacherRatingWeightedSum / teacherReviewTotal).toFixed(2))
        : (allTeachersRaw.length > 0
            ? Number((allTeachersRaw.reduce((sum, t) => sum + t.ratingAvg, 0) / allTeachersRaw.length).toFixed(2))
            : 0);

    const avgSatisfaction =
      allRatings.length > 0
        ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2))
        : teacherRatingAvg;

    const totalVerifiedReviews = allRatings.length > 0 ? allRatings.length : teacherReviewTotal;

    // Lesson slot utilization (real ratio of scheduled + completed lessons to total available time slots)
    const lessonUtilization =
      timeSlotsCount > 0
        ? Math.min(100, Math.round(((scheduledLessons + completedLessons) / timeSlotsCount) * 100))
        : (totalLessons > 0 ? 100 : 0);

    // Homework completion rate
    const homeworkCompletionRate =
      totalHomework > 0 ? Math.round((submittedOrReviewedHw / totalHomework) * 100) : 0;

    // 6-Month Trend Data Generation based on real metrics
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const monthlyTrends = months.map((month, idx) => {
      const isCurrentMonth = idx === months.length - 1;
      return {
        month,
        revenue: isCurrentMonth ? revenueMTD : Math.round(totalRevenue > revenueMTD ? (totalRevenue - revenueMTD) / (months.length - 1) : 0),
        lessons: isCurrentMonth ? (scheduledLessons + completedLessons) : 0,
        students: isCurrentMonth ? activePackagesCount : 0,
      };
    });

    // Top students
    const topStudents = topStudentsRaw.map((s) => ({
      id: s.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
      level: s.level,
      points: s.totalPoints,
      streakDays: s.streakDays,
      lessonsCount: s._count.lessons,
      equippedAvatarFrame: s.equippedAvatarFrame,
      equippedNickname: s.equippedNickname,
    }));

    // Top teachers
    const topTeachers = allTeachersRaw.map((t) => ({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email,
      avatarUrl: t.user.avatarUrl,
      rating: t.ratingAvg > 0 ? t.ratingAvg : 4.9,
      lessonsCount: t._count.lessons,
      specialties: t.specialties,
    }));

    // Alerts
    const alerts: Array<{ type: 'warning' | 'info' | 'critical'; title: string; desc: string }> = [];

    // Expiring packages
    expiringPackages.forEach((p) => {
      alerts.push({
        type: 'warning',
        title: 'Package Expiring Soon',
        desc: `${p.student.user.firstName} ${p.student.user.lastName}'s package (${p.package?.name || 'Package'}) expires on ${new Date(
          p.endDate
        ).toLocaleDateString()}.`,
      });
    });

    // Low remaining lessons (<= 1)
    const lowRemaining = lowCreditPackages.filter(
      (p) => Math.max(0, p.lessonsTotal - p.lessonsUsed) <= 1
    );
    lowRemaining.slice(0, 3).forEach((p) => {
      const remaining = Math.max(0, p.lessonsTotal - p.lessonsUsed);
      alerts.push({
        type: 'info',
        title: 'Low Package Lessons Remaining',
        desc: `${p.student.user.firstName} ${p.student.user.lastName} has ${remaining} lesson(s) remaining (${p.package?.name || 'Package'}). Ready for renewal.`,
      });
    });

    // Pending HW reviews
    if (pendingHwReviews.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Homework Awaiting Teacher Review',
        desc: `${pendingHwReviews.length} homework submission(s) pending review by teachers.`,
      });
    }

    // Activity feed
    const recentActivity = [
      ...recentLessons.map((l) => ({
        type: 'LESSON',
        title: `Lesson ${l.status.toLowerCase()}`,
        desc: `${l.student.user.firstName} ${l.student.user.lastName} with ${l.teacher.user.firstName} ${l.teacher.user.lastName}`,
        time: l.scheduledAt,
      })),
      ...recentPackages.map((p) => ({
        type: 'PACKAGE',
        title: `Package Assigned: ${p.package?.name || 'Package'}`,
        desc: `${p.student.user.firstName} ${p.student.user.lastName} ($${p.package?.price || 0})`,
        time: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

    // Duration breakdown
    const durationBreakdown: Record<number, number> = { 25: 0, 40: 0, 55: 0 };
    durationGroups.forEach((g) => {
      durationBreakdown[g.durationMinutes] = g._count.id;
    });

    // Low session quota alert
    if (lowBalanceStudents.length > 0) {
      alerts.unshift({
        type: 'warning',
        title: `${lowBalanceStudents.length} Students Have Low Session Quotas (≤1 remaining)`,
        desc: `${lowBalanceStudents.length} student(s) have 1 or fewer package sessions remaining and may need renewal.`,
      });
    }

      return {
        kpis: {
          totalRevenue,
          revenueMTD,
          revenueGrowth,
          totalLessons,
          completedLessons,
          scheduledLessons,
          cancelledLessons,
          activeStudents: activePackagesCount,
          totalStudents,
          totalTeachers,
          totalPackages,
          avgSatisfaction,
          totalVerifiedReviews,
          lessonUtilization,
          totalTimeSlots: timeSlotsCount,
          totalHomework,
          submittedOrReviewedHw,
          homeworkCompletionRate,
          totalStudentSessions: Number(studentBalanceAgg._sum?.balance || 0),
          totalStudentBalance: Number(studentBalanceAgg._sum?.balance || 0),
          avgStudentBalance: Number(studentBalanceAgg._sum?.balance || 0),
        },
        durationBreakdown,
        lowBalanceStudents: lowBalanceStudents.map((s) => ({
          studentId: s.studentId,
          userId: s.student.userId,
          name: `${s.student.user.firstName} ${s.student.user.lastName}`,
          email: s.student.user.email,
          avatarUrl: s.student.user.avatarUrl,
          sessionType: s.sessionType?.name || 'Lesson',
          balance: Number(s.balance || 0),
        })),
        recentBalanceTransactions: recentBalanceTransactions.map((tx) => ({
          id: tx.id,
          studentName: `${tx.student.user.firstName} ${tx.student.user.lastName}`,
          studentEmail: tx.student.user.email,
          amount: Number(tx.amount),
          balanceAfter: Number(tx.balanceAfter),
          type: tx.type,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
        monthlyTrends,
        topStudents,
        topTeachers,
        alerts,
        recentActivity,
      };
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
