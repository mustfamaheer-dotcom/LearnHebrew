import { prisma } from '../../config/database';
import { SlotType } from '@prisma/client';

export async function listTeachers() {
  return prisma.teacher.findMany({
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
      timeSlots: true,
      lessons: {
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
        },
      },
      _count: {
        select: { lessons: true },
      },
    },
  });
}

export async function getTeacherById(id: string) {
  // Support lookup by teacherId or userId
  const teacher = await prisma.teacher.findFirst({
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
        },
      },
      timeSlots: true,
    },
  });

  if (!teacher) throw { status: 404, message: 'Teacher not found' };
  return teacher;
}

export async function getTeacherCalendar(teacherIdOrUserId: string) {
  const teacher = await getTeacherById(teacherIdOrUserId);

  const [lessons, slots] = await Promise.all([
    prisma.lesson.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.timeSlot.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
  ]);

  return { lessons, slots };
}

export async function getTeacherSlots(teacherIdOrUserId: string) {
  const teacher = await getTeacherById(teacherIdOrUserId);
  return prisma.timeSlot.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function addSlot(
  teacherIdOrUserId: string,
  data: {
    dayOfWeek: number;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    slotType?: SlotType;
  }
) {
  const teacher = await getTeacherById(teacherIdOrUserId);

  let endTime = data.endTime;
  const duration = data.durationMinutes || 25;
  if (!endTime) {
    const [h, m] = data.startTime.split(':').map(Number);
    const totalMin = h * 60 + m + duration;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  return prisma.timeSlot.create({
    data: {
      teacherId: teacher.id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime,
      slotType: data.slotType || SlotType.REGULAR,
      isAvailable: true,
    },
  });
}

export async function deleteSlot(slotId: string) {
  return prisma.timeSlot.delete({
    where: { id: slotId },
  });
}

export async function getTeacherStudents(teacherIdOrUserId: string) {
  const teacher = await getTeacherById(teacherIdOrUserId);

  // Get all students enrolled in the system
  const allStudents = await prisma.student.findMany({
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true },
      },
      packages: {
        where: { status: 'ACTIVE' },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      },
      lessons: {
        where: { teacherId: teacher.id },
        orderBy: { scheduledAt: 'desc' },
      },
      homeworks: {
        where: { teacherId: teacher.id },
        orderBy: { createdAt: 'desc' },
      },
      gameSessions: {
        take: 5,
        orderBy: { playedAt: 'desc' },
        include: { game: { select: { title: true, gameType: true } } },
      },
      feedback: {
        take: 3,
        orderBy: { submittedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  return allStudents.map((s) => {
    const teacherLessons = s.lessons || [];
    const completedLessons = teacherLessons.filter((l) => l.status === 'COMPLETED');
    const scheduledLessons = teacherLessons.filter(
      (l) => l.status === 'SCHEDULED' && new Date(l.scheduledAt) >= now
    );
    const pastLessons = teacherLessons.filter(
      (l) => l.status === 'COMPLETED' || new Date(l.scheduledAt) < now
    );

    const nextLesson = scheduledLessons.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )[0] || null;

    const lastLesson = pastLessons[0] || null;

    const hw = s.homeworks || [];
    const pendingHw = hw.filter((h) => h.status === 'PENDING').length;
    const submittedHw = hw.filter((h) => h.status === 'SUBMITTED').length;
    const reviewedHw = hw.filter((h) => h.status === 'REVIEWED').length;

    // Remaining lessons calculation
    const activePkg = s.packages[0];
    const lessonsRemaining = activePkg
      ? Math.max(0, activePkg.lessonsTotal - activePkg.lessonsUsed)
      : 0;

    return {
      id: s.id,
      userId: s.userId,
      user: s.user,
      level: s.level,
      totalPoints: s.totalPoints,
      streakDays: s.streakDays,
      createdAt: s.createdAt,
      stats: {
        completedLessonsCount: completedLessons.length,
        scheduledLessonsCount: scheduledLessons.length,
        totalLessonsWithTeacher: teacherLessons.length,
        lessonsRemaining,
        homework: {
          total: hw.length,
          pending: pendingHw,
          submitted: submittedHw,
          reviewed: reviewedHw,
        },
        gamesPlayed: s.gameSessions?.length || 0,
      },
      nextLesson: nextLesson
        ? {
            id: nextLesson.id,
            scheduledAt: nextLesson.scheduledAt,
            durationMinutes: nextLesson.durationMinutes,
            status: nextLesson.status,
          }
        : null,
      lastLesson: lastLesson
        ? {
            id: lastLesson.id,
            scheduledAt: lastLesson.scheduledAt,
            durationMinutes: lastLesson.durationMinutes,
            status: lastLesson.status,
            teacherNotes: lastLesson.teacherNotes,
          }
        : null,
      activePackage: activePkg
        ? {
            id: activePkg.id,
            name: activePkg.package.name,
            nameHe: activePkg.package.nameHe,
            lessonsTotal: activePkg.lessonsTotal,
            lessonsUsed: activePkg.lessonsUsed,
            endDate: activePkg.endDate,
          }
        : null,
      recentHomework: hw.slice(0, 3),
      recentFeedback: s.feedback,
    };
  });
}

