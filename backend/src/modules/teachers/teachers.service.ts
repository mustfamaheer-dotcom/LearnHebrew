import { prisma } from '../../config/database';
import { SlotType } from '@prisma/client';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listTeachers() {
  return getCachedOrFetch('teachers:list', 60, async () => {
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
        timeSlots: {
          where: { isAvailable: true },
        },
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
  });
}

export async function getTeacherById(id: string) {
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
        sessionType: true,
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.timeSlot.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ date: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
  ]);

  return { lessons, slots, defaultZoomLink: teacher.defaultZoomLink };
}

export async function getTeacherSlots(teacherIdOrUserId: string) {
  const teacher = await getTeacherById(teacherIdOrUserId);
  return prisma.timeSlot.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ date: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

/**
 * Teachers plan open available slots up to 45 coming days ahead.
 * No duration locked here; students choose duration/sessionType during booking.
 */
export async function addSlot(
  teacherIdOrUserId: string,
  data: {
    date?: string | Date;
    dayOfWeek?: number;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    slotType?: SlotType;
    zoomLink?: string;
    saveAsDefault?: boolean;
  }
) {
  const teacher = await getTeacherById(teacherIdOrUserId);

  let slotDate: Date | null = null;
  if (data.date) {
    slotDate = new Date(data.date);
    const now = new Date();
    const maxDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // Strict 45 days limit

    if (slotDate > maxDate) {
      throw { status: 400, message: 'Open time slots can only be planned up to 45 days in advance.' };
    }
  }

  const zoomUrl = data.zoomLink?.trim() || teacher.defaultZoomLink || 'https://zoom.us/j/engrew-live';

  if (data.saveAsDefault || !teacher.defaultZoomLink) {
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { defaultZoomLink: zoomUrl },
    });
  }

  const created = await prisma.timeSlot.create({
    data: {
      teacherId: teacher.id,
      date: slotDate,
      dayOfWeek: data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : (slotDate ? slotDate.getDay() : 0),
      startTime: data.startTime,
      endTime: data.endTime || null,
      slotType: data.slotType || SlotType.REGULAR,
      isAvailable: true,
      isBooked: false,
      zoomLink: zoomUrl,
    },
  });

  await cacheInvalidatePrefix('teachers:');
  return created;
}

export async function deleteSlot(slotId: string) {
  const deleted = await prisma.timeSlot.delete({
    where: { id: slotId },
  });
  await cacheInvalidatePrefix('teachers:');
  return deleted;
}

export async function getTeacherStudents(teacherIdOrUserId: string) {
  const teacher = await getTeacherById(teacherIdOrUserId);

  const allStudents = await prisma.student.findMany({
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true },
      },
      levelModel: true,
      sessionBalances: {
        include: { sessionType: true },
      },
      lessons: {
        where: { teacherId: teacher.id },
        include: { sessionType: true },
        orderBy: { scheduledAt: 'desc' },
      },
      homeworks: {
        where: { teacherId: teacher.id },
        orderBy: { createdAt: 'desc' },
      },
      gameUnlocks: {
        include: { game: true },
      },
      examAttempts: {
        include: { exam: true },
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
    const nextLesson = scheduledLessons[0] || null;

    return {
      student: s,
      stats: {
        totalLessons: teacherLessons.length,
        completedLessons: completedLessons.length,
        scheduledLessons: scheduledLessons.length,
        nextLesson,
      },
    };
  });
}
