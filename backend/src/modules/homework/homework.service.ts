import { prisma } from '../../config/database';
import { HomeworkStatus, PointsEventType } from '@prisma/client';

export async function listHomework(params: {
  studentId?: string;
  teacherId?: string;
  userRole?: string;
  userId?: string;
}) {
  const where: any = {};

  if (params.userRole === 'STUDENT' && params.userId) {
    const student = await prisma.student.findUnique({ where: { userId: params.userId } });
    if (student) where.studentId = student.id;
  } else if (params.studentId) {
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: params.studentId }, { userId: params.studentId }] },
    });
    if (student) where.studentId = student.id;
  }

  if (params.userRole === 'TEACHER' && params.userId) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: params.userId } });
    if (teacher) where.teacherId = teacher.id;
  } else if (params.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { OR: [{ id: params.teacherId }, { userId: params.teacherId }] },
    });
    if (teacher) where.teacherId = teacher.id;
  }

  return prisma.homework.findMany({
    where,
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      lesson: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createHomework(data: {
  lessonId?: string;
  studentId: string;
  teacherId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: data.teacherId }, { userId: data.teacherId }] },
  });
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  return prisma.homework.create({
    data: {
      lessonId: data.lessonId,
      studentId: student.id,
      teacherId: teacher.id,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: HomeworkStatus.PENDING,
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });
}

export async function submitHomework(id: string, studentNote: string) {
  const hw = await prisma.homework.findUnique({ where: { id } });
  if (!hw) throw { status: 404, message: 'Homework not found' };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.homework.update({
      where: { id },
      data: {
        status: HomeworkStatus.SUBMITTED,
        studentNote,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    });

    // Award +20 points for homework submission
    await tx.student.update({
      where: { id: hw.studentId },
      data: { totalPoints: { increment: 20 } },
    });

    await tx.pointsLedger.create({
      data: {
        studentId: hw.studentId,
        eventType: PointsEventType.HOMEWORK_SUBMITTED,
        points: 20,
        referenceId: hw.id,
        description: `Submitted homework: ${hw.title}`,
      },
    });

    return updated;
  });
}

export async function reviewHomework(id: string, teacherFeedback: string) {
  return prisma.homework.update({
    where: { id },
    data: {
      status: HomeworkStatus.REVIEWED,
      teacherFeedback,
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });
}

