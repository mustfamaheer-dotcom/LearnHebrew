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
      : 0;

  const totalTeacherSurveys = teacherSurveys.length;
  const avgTeacherOverall =
    totalTeacherSurveys > 0
      ? Number((teacherSurveys.reduce((sum, s) => sum + s.overallRating, 0) / totalTeacherSurveys).toFixed(2))
      : 0;

  return {
    summary: {
      totalLessonReviews,
      avgLessonQuality,
      totalTeacherSurveys,
      avgTeacherOverall,
    },
    recentLessonFeedbacks: lessonFeedbacks.slice(0, 10),
    recentTeacherSurveys: teacherSurveys.slice(0, 10),
  };
}

export async function getFeedbackAnalytics() {
  return getReviewsAnalytics();
}
