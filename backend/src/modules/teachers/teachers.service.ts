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

  const lessons = await prisma.lesson.findMany({
    where: { teacherId: teacher.id },
    select: {
      student: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
          packages: { where: { status: 'ACTIVE' }, include: { package: true } },
        },
      },
    },
    distinct: ['studentId'],
  });

  return lessons.map((l) => l.student);
}

