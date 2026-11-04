import { prisma } from '../../config/database';
import { HebrewLevel } from '@prisma/client';

export async function listStudents() {
  return prisma.student.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      packages: {
        where: { status: 'ACTIVE' },
        include: { package: true },
      },
      _count: {
        select: { lessons: true, homeworks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          languagePref: true,
        },
      },
      packages: {
        include: { package: true },
      },
    },
  });

  if (!student) throw { status: 404, message: 'Student not found' };
  return student;
}

export async function updateStudentLevel(studentIdOrUserId: string, level: HebrewLevel) {
  const student = await getStudentById(studentIdOrUserId);
  return prisma.student.update({
    where: { id: student.id },
    data: { level },
    include: { user: true },
  });
}

export async function getStudentDashboard(studentIdOrUserId: string) {
  const student = await getStudentById(studentIdOrUserId);

  const now = new Date();

  const [upcomingLessons, activePackage, recentHomework, pointsHistory, recentLessons] =
    await Promise.all([
      prisma.lesson.findMany({
        where: {
          studentId: student.id,
          scheduledAt: { gte: now },
          status: 'SCHEDULED',
        },
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),
      prisma.studentPackage.findFirst({
        where: {
          studentId: student.id,
          status: 'ACTIVE',
        },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.homework.findMany({
        where: {
          studentId: student.id,
          status: { in: ['PENDING', 'SUBMITTED'] },
        },
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 3,
      }),
      prisma.pointsLedger.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.lesson.findMany({
        where: {
          studentId: student.id,
          status: 'COMPLETED',
        },
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          feedback: true,
        },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      }),
    ]);

  return {
    student,
    upcomingLessons,
    activePackage,
    recentHomework,
    pointsHistory,
    recentLessons,
  };
}

export async function getStudentLessons(studentIdOrUserId: string) {
  const student = await getStudentById(studentIdOrUserId);
  return prisma.lesson.findMany({
    where: { studentId: student.id },
    include: {
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      feedback: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });
}

export async function getStudentPackages(studentIdOrUserId: string) {
  const student = await getStudentById(studentIdOrUserId);
  return prisma.studentPackage.findMany({
    where: { studentId: student.id },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStudentPoints(studentIdOrUserId: string) {
  const student = await getStudentById(studentIdOrUserId);
  const ledger = await prisma.pointsLedger.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
  });

  return {
    totalPoints: student.totalPoints,
    streakDays: student.streakDays,
    ledger,
  };
}

export async function getStudentHomework(studentIdOrUserId: string) {
  const student = await getStudentById(studentIdOrUserId);
  return prisma.homework.findMany({
    where: { studentId: student.id },
    include: {
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      lesson: true,
    },
    orderBy: { dueDate: 'desc' },
  });
}

