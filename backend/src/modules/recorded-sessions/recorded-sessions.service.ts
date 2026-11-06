import { prisma } from '../../config/database';

export async function listRecordedSessions(params: {
  teacherId?: string;
  studentId?: string;
  category?: string;
  userRole?: string;
  userId?: string;
}) {
  const where: any = { isPublished: true };

  if (params.userRole === 'STUDENT' && params.userId) {
    const student = await prisma.student.findUnique({ where: { userId: params.userId } });
    if (student) {
      where.OR = [
        { studentId: student.id },
        { studentId: null }, // broadcast / available to all
      ];
    }
  } else if (params.studentId) {
    where.OR = [
      { studentId: params.studentId },
      { studentId: null },
    ];
  }

  if (params.userRole === 'TEACHER' && params.userId) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: params.userId } });
    if (teacher) {
      // Teachers can see their own recorded sessions, including unpublished
      delete where.isPublished;
      where.teacherId = teacher.id;
    }
  } else if (params.teacherId) {
    where.teacherId = params.teacherId;
  }

  if (params.category && params.category !== 'ALL') {
    where.category = params.category;
  }

  return prisma.recordedSession.findMany({
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
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
      lesson: {
        select: { id: true, scheduledAt: true, status: true },
      },
    },
    orderBy: [
      { category: 'asc' },
      { sessionNumber: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function createRecordedSession(data: {
  teacherUserId: string;
  studentId?: string;
  lessonId?: string;
  title: string;
  titleHe?: string;
  description?: string;
  category: string;
  sessionNumber: number;
  videoUrl: string;
  durationMinutes?: number;
}) {
  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: data.teacherUserId }, { userId: data.teacherUserId }] },
  });
  if (!teacher) throw { status: 404, message: 'Teacher profile not found' };

  let studentId: string | null = null;
  if (data.studentId && data.studentId !== 'ALL' && data.studentId !== '') {
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
    });
    if (student) studentId = student.id;
  }

  return prisma.recordedSession.create({
    data: {
      teacherId: teacher.id,
      studentId: studentId,
      lessonId: data.lessonId || null,
      title: data.title,
      titleHe: data.titleHe || null,
      description: data.description || null,
      category: data.category || 'General',
      sessionNumber: data.sessionNumber || 1,
      videoUrl: data.videoUrl,
      durationMinutes: data.durationMinutes || 25,
      isPublished: true,
    },
    include: {
      teacher: { include: { user: true } },
      student: { include: { user: true } },
    },
  });
}

export async function updateRecordedSession(
  id: string,
  data: {
    title?: string;
    titleHe?: string;
    description?: string;
    category?: string;
    sessionNumber?: number;
    videoUrl?: string;
    durationMinutes?: number;
    isPublished?: boolean;
  }
) {
  return prisma.recordedSession.update({
    where: { id },
    data,
    include: {
      teacher: { include: { user: true } },
      student: { include: { user: true } },
    },
  });
}

export async function deleteRecordedSession(id: string) {
  return prisma.recordedSession.delete({
    where: { id },
  });
}

