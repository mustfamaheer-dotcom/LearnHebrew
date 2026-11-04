import { prisma } from '../../config/database';

export async function submitLessonFeedback(
  lessonId: string,
  userId: string,
  data: {
    qualityRating: number;
    difficulty: number;
    paceRating: number;
    comments?: string;
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

export async function submitTeacherSurvey(
  teacherId: string,
  userId: string,
  data: {
    communication: number;
    knowledge: number;
    punctuality: number;
    overallRating: number;
    comments?: string;
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

export async function listTeacherSurveys(teacherId?: string) {
  const where: any = {};
  if (teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { OR: [{ id: teacherId }, { userId: teacherId }] },
    });
    if (teacher) where.teacherId = teacher.id;
  }

  return prisma.teacherSurvey.findMany({
    where,
    include: {
      teacher: { include: { user: true } },
      student: { include: { user: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

