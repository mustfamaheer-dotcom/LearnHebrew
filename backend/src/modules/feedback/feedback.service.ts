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
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.teacherId) where.lesson = { teacherId: params.teacherId };

  if (params?.minRating || params?.maxRating) {
    where.qualityRating = {};
    if (params.minRating) where.qualityRating.gte = params.minRating;
    if (params.maxRating) where.qualityRating.lte = params.maxRating;
  }

  if (params?.search && params.search.trim()) {
    where.comments = { contains: params.search.trim(), mode: 'insensitive' };
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
  return prisma.lessonFeedback.delete({ where: { id } });
}

/**
 * Teacher Survey submission:
 * Strictly 1 survey per teacher with a 7-day editing window.
 * After 7 days, editing is permanently locked.
 */
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

  const existingSurvey = await prisma.teacherSurvey.findUnique({
    where: {
      studentId_teacherId: {
        studentId: student.id,
        teacherId: teacher.id,
      },
    },
  });

  const now = new Date();

  // If editing an existing survey, check 7-day window
  if (existingSurvey) {
    const lockTime = existingSurvey.editLockedAt || new Date(existingSurvey.submittedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (now > lockTime) {
      throw {
        status: 403,
        message: 'Review window has expired. Student surveys can only be edited within 1 week of submission.',
      };
    }

    const updated = await prisma.teacherSurvey.update({
      where: { id: existingSurvey.id },
      data: {
        ...data,
        lastEditedAt: now,
      },
    });

    await updateTeacherRating(teacher.id);
    return updated;
  }

  // Create new survey with 7-day editLock window
  const editLockedAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const survey = await prisma.teacherSurvey.create({
    data: {
      studentId: student.id,
      teacherId: teacher.id,
      ...data,
      submittedAt: now,
      editLockedAt,
    },
  });

  await updateTeacherRating(teacher.id);
  return survey;
}

async function updateTeacherRating(teacherId: string) {
  const allSurveys = await prisma.teacherSurvey.findMany({
    where: { teacherId },
  });
  const avg =
    allSurveys.reduce((sum, s) => sum + s.overallRating, 0) / (allSurveys.length || 1);

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      ratingAvg: parseFloat(avg.toFixed(2)),
      ratingCount: allSurveys.length,
    },
  });
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

  if (params?.minRating) where.overallRating = { gte: params.minRating };
  if (params?.search && params.search.trim()) {
    where.comments = { contains: params.search.trim(), mode: 'insensitive' };
  }

  return prisma.teacherSurvey.findMany({
    where,
    include: {
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      },
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function deleteTeacherSurvey(id: string) {
  return prisma.teacherSurvey.delete({ where: { id } });
}

export async function getReviewsAnalytics() {
  const [lessonFeedbacks, teacherSurveys, teachers] = await Promise.all([
    prisma.lessonFeedback.findMany({
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
        lesson: {
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
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
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
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

  const totalLessonReviews = lessonFeedbacks.length;
  const avgLessonQuality =
    totalLessonReviews > 0
      ? Number((lessonFeedbacks.reduce((sum, f) => sum + f.qualityRating, 0) / totalLessonReviews).toFixed(2))
      : 5.0;

  const totalTeacherSurveys = teacherSurveys.length;
  const avgTeacherOverall =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.overallRating, 0) / totalTeacherSurveys).toFixed(2))
      : 5.0;

  const avgCommunication =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.communication, 0) / totalTeacherSurveys).toFixed(2))
      : 5.0;

  const avgKnowledge =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.knowledge, 0) / totalTeacherSurveys).toFixed(2))
      : 5.0;

  const avgPunctuality =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.punctuality, 0) / totalTeacherSurveys).toFixed(2))
      : 5.0;

  // 1. Lesson Quality Distribution (1 - 5 stars)
  const qualityDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of lessonFeedbacks) {
    const r = Math.min(5, Math.max(1, f.qualityRating));
    qualityDistribution[r] = (qualityDistribution[r] || 0) + 1;
  }

  // 2. Teacher Survey Overall Distribution (1 - 5 stars)
  const teacherRatingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const s of teacherSurveys) {
    const r = Math.min(5, Math.max(1, s.overallRating));
    teacherRatingDistribution[r] = (teacherRatingDistribution[r] || 0) + 1;
  }

  // 3. Pace Distribution
  // slow <= 2, justRight === 3, fast >= 4
  const paceDistribution = { slow: 0, justRight: 0, fast: 0 };
  for (const f of lessonFeedbacks) {
    if (f.paceRating <= 2) paceDistribution.slow++;
    else if (f.paceRating === 3) paceDistribution.justRight++;
    else paceDistribution.fast++;
  }

  // 4. Difficulty Distribution
  // easy <= 2, balanced === 3, challenging >= 4
  const difficultyDistribution = { easy: 0, balanced: 0, challenging: 0 };
  for (const f of lessonFeedbacks) {
    if (f.difficulty <= 2) difficultyDistribution.easy++;
    else if (f.difficulty === 3) difficultyDistribution.balanced++;
    else difficultyDistribution.challenging++;
  }

  // 5. Teacher Performance Scorecards & Ranking
  const teacherPerformance = teachers.map((t) => {
    const tSurveys = teacherSurveys.filter((s) => s.teacherId === t.id);
    const tLessonFeedbacks = lessonFeedbacks.filter((f) => f.lesson?.teacherId === t.id);
    const reviewCount = tSurveys.length + tLessonFeedbacks.length;

    const avgOverall =
      tSurveys.length > 0
        ? Number((tSurveys.reduce((sum, s) => sum + s.overallRating, 0) / tSurveys.length).toFixed(2))
        : t.ratingAvg || 5.0;

    const tComm =
      tSurveys.length > 0
        ? Number((tSurveys.reduce((sum, s) => sum + s.communication, 0) / tSurveys.length).toFixed(2))
        : 5.0;

    const tKnowledge =
      tSurveys.length > 0
        ? Number((tSurveys.reduce((sum, s) => sum + s.knowledge, 0) / tSurveys.length).toFixed(2))
        : 5.0;

    const tPunctuality =
      tSurveys.length > 0
        ? Number((tSurveys.reduce((sum, s) => sum + s.punctuality, 0) / tSurveys.length).toFixed(2))
        : 5.0;

    return {
      teacherId: t.id,
      name: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || 'Instructor',
      email: t.user?.email || '',
      reviewCount,
      avgOverall,
      avgCommunication: tComm,
      avgKnowledge: tKnowledge,
      avgPunctuality: tPunctuality,
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

export async function getFeedbackAnalytics() {
  return getReviewsAnalytics();
}
