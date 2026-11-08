import { prisma } from '../../config/database';

export async function submitLessonFeedback(
  lessonId: string,
  userId: string,
  data: {
    qualityRating: number;
    difficulty: number;
    paceRating: number;
    comments?: string | null;
  }
) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw { status: 403, message: 'Only students can submit feedback' };

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.studentId !== student.id) {
    throw { status: 404, message: 'Lesson not found for this student' };
  }

  return prisma.lessonFeedback.upsert({
    where: { lessonId },
    update: data,
    create: {
      lessonId,
      studentId: student.id,
      ...data,
    },
  });
}

export async function getLessonFeedback(lessonId: string) {
  return prisma.lessonFeedback.findUnique({
    where: { lessonId },
    include: { student: { include: { user: true } } },
  });
}

export async function listLessonFeedbacks(params?: {
  teacherId?: string;
  studentId?: string;
  minRating?: number;
  maxRating?: number;
  search?: string;
}) {
  const where: any = {};

  if (params?.studentId) {
    where.studentId = params.studentId;
  }

  if (params?.teacherId) {
    where.lesson = {
      teacherId: params.teacherId,
    };
  }

  if (params?.minRating || params?.maxRating) {
    where.qualityRating = {};
    if (params.minRating) where.qualityRating.gte = params.minRating;
    if (params.maxRating) where.qualityRating.lte = params.maxRating;
  }

  if (params?.search && params.search.trim()) {
    where.comments = {
      contains: params.search.trim(),
      mode: 'insensitive',
    };
  }

  return prisma.lessonFeedback.findMany({
    where,
    include: {
      student: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
      },
      lesson: {
        include: {
          teacher: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function deleteLessonFeedback(id: string) {
  return prisma.lessonFeedback.delete({
    where: { id },
  });
}

export async function submitTeacherSurvey(
  teacherId: string,
  userId: string,
  data: {
    communication: number;
    knowledge: number;
    punctuality: number;
    overallRating: number;
    comments?: string | null;
  }
) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw { status: 403, message: 'Only students can submit teacher surveys' };

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: teacherId }, { userId: teacherId }] },
  });
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  const survey = await prisma.teacherSurvey.upsert({
    where: {
      studentId_teacherId: {
        studentId: student.id,
        teacherId: teacher.id,
      },
    },
    update: data,
    create: {
      studentId: student.id,
      teacherId: teacher.id,
      ...data,
    },
  });

  // Re-calculate teacher average rating
  const allSurveys = await prisma.teacherSurvey.findMany({
    where: { teacherId: teacher.id },
  });
  const avg =
    allSurveys.reduce((sum, s) => sum + s.overallRating, 0) / (allSurveys.length || 1);

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      ratingAvg: parseFloat(avg.toFixed(2)),
      ratingCount: allSurveys.length,
    },
  });

  return survey;
}

export async function listTeacherSurveys(params?: {
  teacherId?: string;
  minRating?: number;
  search?: string;
}) {
  const where: any = {};
  if (params?.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { OR: [{ id: params.teacherId }, { userId: params.teacherId }] },
    });
    if (teacher) where.teacherId = teacher.id;
  }

  if (params?.minRating) {
    where.overallRating = { gte: params.minRating };
  }

  if (params?.search && params.search.trim()) {
    where.comments = {
      contains: params.search.trim(),
      mode: 'insensitive',
    };
  }

  return prisma.teacherSurvey.findMany({
    where,
    include: {
      teacher: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
      },
      student: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function deleteTeacherSurvey(id: string) {
  const survey = await prisma.teacherSurvey.delete({
    where: { id },
  });

  // Recalculate teacher ratingAvg & ratingCount
  const remainingSurveys = await prisma.teacherSurvey.findMany({
    where: { teacherId: survey.teacherId },
  });
  const avg =
    remainingSurveys.length > 0
      ? remainingSurveys.reduce((sum, s) => sum + s.overallRating, 0) / remainingSurveys.length
      : 0;

  await prisma.teacher.update({
    where: { id: survey.teacherId },
    data: {
      ratingAvg: parseFloat(avg.toFixed(2)),
      ratingCount: remainingSurveys.length,
    },
  });

  return survey;
}

export async function getFeedbackAnalytics() {
  const [lessonFeedbacks, teacherSurveys, teachers] = await Promise.all([
    prisma.lessonFeedback.findMany({
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
        lesson: {
          include: {
            teacher: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.teacherSurvey.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.teacher.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    }),
  ]);

  // Lesson stats
  const totalLessonReviews = lessonFeedbacks.length;
  const avgLessonQuality =
    totalLessonReviews > 0
      ? Number((lessonFeedbacks.reduce((sum, f) => sum + f.qualityRating, 0) / totalLessonReviews).toFixed(2))
      : 0;

  const qualityDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const paceDistribution = { slow: 0, justRight: 0, fast: 0 };
  const difficultyDistribution = { easy: 0, balanced: 0, challenging: 0 };

  lessonFeedbacks.forEach((f) => {
    if (f.qualityRating >= 1 && f.qualityRating <= 5) {
      qualityDistribution[f.qualityRating] = (qualityDistribution[f.qualityRating] || 0) + 1;
    }
    if (f.paceRating <= 2) paceDistribution.slow++;
    else if (f.paceRating === 3) paceDistribution.justRight++;
    else paceDistribution.fast++;

    if (f.difficulty <= 2) difficultyDistribution.easy++;
    else if (f.difficulty === 3) difficultyDistribution.balanced++;
    else difficultyDistribution.challenging++;
  });

  // Teacher survey stats
  const totalTeacherSurveys = teacherSurveys.length;
  const avgTeacherOverall =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.overallRating, 0) / totalTeacherSurveys).toFixed(2))
      : 0;
  const avgCommunication =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.communication, 0) / totalTeacherSurveys).toFixed(2))
      : 0;
  const avgKnowledge =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.knowledge, 0) / totalTeacherSurveys).toFixed(2))
      : 0;
  const avgPunctuality =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.punctuality, 0) / totalTeacherSurveys).toFixed(2))
      : 0;

  const teacherRatingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  teacherSurveys.forEach((s) => {
    if (s.overallRating >= 1 && s.overallRating <= 5) {
      teacherRatingDistribution[s.overallRating] = (teacherRatingDistribution[s.overallRating] || 0) + 1;
    }
  });

  // Teacher performance breakdown
  const teacherPerformance = teachers.map((t) => {
    const surveysForTeacher = teacherSurveys.filter((s) => s.teacherId === t.id);
    const count = surveysForTeacher.length;
    const avgOverall =
      count > 0
        ? Number((surveysForTeacher.reduce((sum, s) => sum + s.overallRating, 0) / count).toFixed(2))
        : Number(t.ratingAvg || 0);
    const avgComm =
      count > 0
        ? Number((surveysForTeacher.reduce((sum, s) => sum + s.communication, 0) / count).toFixed(2))
        : 0;
    const avgKnow =
      count > 0
        ? Number((surveysForTeacher.reduce((sum, s) => sum + s.knowledge, 0) / count).toFixed(2))
        : 0;
    const avgPunc =
      count > 0
        ? Number((surveysForTeacher.reduce((sum, s) => sum + s.punctuality, 0) / count).toFixed(2))
        : 0;

    return {
      teacherId: t.id,
      name: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || 'Teacher',
      email: t.user?.email || '',
      avatarUrl: t.user?.avatarUrl || null,
      reviewCount: count,
      avgOverall,
      avgCommunication: avgComm,
      avgKnowledge: avgKnow,
      avgPunctuality: avgPunc,
    };
  }).sort((a, b) => b.avgOverall - a.avgOverall || b.reviewCount - a.reviewCount);

  return {
    summary: {
      totalLessonReviews,
      avgLessonQuality,
      totalTeacherSurveys,
      avgTeacherOverall,
      avgCommunication,
      avgKnowledge,
      avgPunctuality,
    },
    qualityDistribution,
    teacherRatingDistribution,
    paceDistribution,
    difficultyDistribution,
    teacherPerformance,
    recentLessonFeedbacks: lessonFeedbacks.slice(0, 10),
    recentTeacherSurveys: teacherSurveys.slice(0, 10),
  };
}
