import { prisma } from '../../config/database';
import { Prisma, SlotType, LessonStatus, AttendanceStatus, PointsEventType } from '@prisma/client';
import { logAuditEvent } from '../../utils/audit';
import { notificationService } from '../notifications/notifications.service';

export async function listLessons(filters: {
  studentId?: string;
  teacherId?: string;
  status?: LessonStatus;
  from?: Date;
  to?: Date;
  userRole?: string;
  userId?: string;
}) {
  const where: any = {};

  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.scheduledAt = {};
    if (filters.from) where.scheduledAt.gte = filters.from;
    if (filters.to) where.scheduledAt.lte = filters.to;
  }

  // Filter based on role if student or teacher
  if (filters.userRole === 'STUDENT' && filters.userId) {
    const student = await prisma.student.findUnique({ where: { userId: filters.userId } });
    if (student) where.studentId = student.id;
  } else if (filters.studentId) {
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: filters.studentId }, { userId: filters.studentId }] },
    });
    if (student) where.studentId = student.id;
  }

  if (filters.userRole === 'TEACHER' && filters.userId) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: filters.userId } });
    if (teacher) where.teacherId = teacher.id;
  } else if (filters.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { OR: [{ id: filters.teacherId }, { userId: filters.teacherId }] },
    });
    if (teacher) where.teacherId = teacher.id;
  }

  return prisma.lesson.findMany({
    where,
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
          levelModel: true,
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      },
      sessionType: true,
      studentPackage: { include: { package: true } },
      homework: true,
      feedback: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });
}

/**
 * Books a lesson strictly from student's session type quota balance.
 * Validates 30-day package expiry, checks teacher open slot, and deducts 1 session atomicity.
 */
export async function bookLesson(data: {
  studentId: string;
  teacherId: string;
  scheduledAt: Date;
  sessionTypeId?: string;
  durationMinutes?: number;
  timeSlotId?: string;
  lessonType?: SlotType;
  zoomLink?: string;
  bookedById: string;
}) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
    include: { user: true },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: data.teacherId }, { userId: data.teacherId }] },
  });
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  const booker = await prisma.user.findUnique({
    where: { id: data.bookedById },
  });
  const isPrivileged = ['ADMIN', 'SUPER_ADMIN', 'SALES', 'CS'].includes(booker?.role || '');

  if (!isPrivileged && student.userId !== data.bookedById) {
    throw {
      status: 403,
      message: 'Access denied: You cannot book lessons using another student account.',
    };
  }

  // 1. Resolve SessionType (or fallback to duration matching session type)
  let sessionType = null;
  if (data.sessionTypeId) {
    sessionType = await prisma.sessionType.findUnique({ where: { id: data.sessionTypeId } });
  } else {
    const dur = data.durationMinutes || 25;
    sessionType = await prisma.sessionType.findFirst({
      where: { durationMinutes: dur, isActive: true },
    });
  }

  if (!sessionType) {
    sessionType = await prisma.sessionType.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  }

  const duration = sessionType?.durationMinutes || 25;

  // 2. Validate Session Balance Quota
  let userSessionBalance = null;
  if (sessionType) {
    userSessionBalance = await prisma.studentSessionBalance.findUnique({
      where: {
        studentId_sessionTypeId: {
          studentId: student.id,
          sessionTypeId: sessionType.id,
        },
      },
    });
  }

  const hasSessionBalance = (userSessionBalance?.balance || 0) > 0;
  const isExpired = userSessionBalance?.expiresAt && new Date() > userSessionBalance.expiresAt;

  if (!isPrivileged) {
    if (isExpired) {
      throw {
        status: 400,
        message: 'Your session package balance has expired (packages have a 30-day maximum validity). Please purchase a new package to continue booking.',
      };
    }
    if (!hasSessionBalance) {
      throw {
        status: 400,
        message: `Insufficient session balance for ${sessionType?.labelEn || `${duration}-min`} sessions. Current balance: 0. Please contact your sales advisor or purchase a session package.`,
      };
    }
  }

  // Conflict prevention: check if another scheduled lesson overlaps with [newStart, newEnd]
  const newStart = new Date(data.scheduledAt);
  const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
  const minSearch = new Date(newStart.getTime() - 2 * 60 * 60 * 1000);
  const maxSearch = new Date(newEnd.getTime() + 2 * 60 * 60 * 1000);

  const existingLessons = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      status: 'SCHEDULED',
      scheduledAt: {
        gte: minSearch,
        lte: maxSearch,
      },
    },
  });

  const conflictingLesson = existingLessons.find((l) => {
    const lStart = new Date(l.scheduledAt);
    const lEnd = new Date(lStart.getTime() + (l.durationMinutes || 25) * 60 * 1000);
    return newStart < lEnd && newEnd > lStart;
  });

  if (conflictingLesson) {
    throw { status: 409, message: 'Teacher already has a lesson scheduled during this time window' };
  }

  return prisma.$transaction(async (tx) => {
    // Deduct 1 session from balance if available
    if (userSessionBalance && userSessionBalance.balance > 0 && sessionType) {
      const newBal = userSessionBalance.balance - 1;
      await tx.studentSessionBalance.update({
        where: { id: userSessionBalance.id },
        data: { balance: newBal },
      });

      await tx.sessionBalanceLedger.create({
        data: {
          studentId: student.id,
          sessionTypeId: sessionType.id,
          delta: -1,
          balanceAfter: newBal,
          reason: 'LESSON_BOOKING',
          createdById: data.bookedById,
        },
      });
    }

    // Resolve Zoom Link
    let resolvedZoomLink = data.zoomLink?.trim();
    if (!resolvedZoomLink || resolvedZoomLink === 'https://zoom.us/j/engrew-live') {
      if (data.timeSlotId) {
        const slot = await tx.timeSlot.findUnique({ where: { id: data.timeSlotId } });
        if (slot?.zoomLink) resolvedZoomLink = slot.zoomLink;
      }
      if (!resolvedZoomLink && teacher.defaultZoomLink) {
        resolvedZoomLink = teacher.defaultZoomLink;
      }
      if (!resolvedZoomLink) {
        resolvedZoomLink = 'https://zoom.us/j/engrew-live';
      }
    }

    const lesson = await tx.lesson.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        timeSlotId: data.timeSlotId,
        sessionTypeId: sessionType?.id,
        scheduledAt: data.scheduledAt,
        durationMinutes: duration,
        lessonType: data.lessonType || SlotType.REGULAR,
        zoomLink: resolvedZoomLink,
        status: LessonStatus.SCHEDULED,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        sessionType: true,
      },
    });

    if (data.timeSlotId) {
      await tx.timeSlot.update({
        where: { id: data.timeSlotId },
        data: { isAvailable: false, isBooked: true },
      });
    }

    await logAuditEvent({
      userId: data.bookedById,
      action: 'LESSON_BOOKED_SESSION_BALANCE',
      entityType: 'Lesson',
      entityId: lesson.id,
      metaJson: {
        sessionType: sessionType?.name,
        duration,
        scheduledAt: data.scheduledAt,
      },
    });

    notificationService.notifyBookingCreated(lesson as any).catch((err) =>
      console.error('[Notification Trigger Error - notifyBookingCreated]', err)
    );

    return lesson;
  });
}

/**
 * Teachers mark student attendance (ATTENDED or ABSENT)
 * Automatically triggers real-time notification to the student
 */
export async function markAttendance(
  lessonId: string,
  teacherUserId: string,
  status: AttendanceStatus
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });

  if (!lesson) throw { status: 404, message: 'Lesson not found' };

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      attendanceStatus: status,
      attendanceMarkedAt: new Date(),
      attendanceMarkedById: teacherUserId,
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });

  // Real-time notification dispatch
  const isAttended = status === AttendanceStatus.ATTENDED;
  await prisma.notification.create({
    data: {
      userId: lesson.student.userId,
      type: 'ATTENDANCE_MARKED',
      title: isAttended ? 'Attendance Confirmed ✅' : 'Marked Absent ⚠️',
      titleEn: isAttended ? 'Attendance Confirmed ✅' : 'Marked Absent ⚠️',
      titleHe: isAttended ? 'נוכחותך בשיעור אושרה בהצלחה ✅' : 'סומנת כנעדר מהשיעור ⚠️',
      body: isAttended
        ? `Your attendance for session with ${lesson.teacher.user.firstName} on ${new Date(lesson.scheduledAt).toLocaleDateString()} was marked as Attended.`
        : `You were marked absent for the session with ${lesson.teacher.user.firstName} on ${new Date(lesson.scheduledAt).toLocaleDateString()}.`,
      bodyEn: isAttended
        ? `Your attendance for session with ${lesson.teacher.user.firstName} on ${new Date(lesson.scheduledAt).toLocaleDateString()} was marked as Attended.`
        : `You were marked absent for the session with ${lesson.teacher.user.firstName} on ${new Date(lesson.scheduledAt).toLocaleDateString()}.`,
      bodyHe: isAttended
        ? `נוכחותך בשיעור עם ${lesson.teacher.user.firstName} אושרה בהצלחה.`
        : `סומנת כנעדר משיעורך עם ${lesson.teacher.user.firstName}.`,
    },
  });

  return updated;
}

export async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      studentPackage: { include: { package: true } },
      sessionType: true,
      homework: true,
      feedback: true,
    },
  });

  if (!lesson) throw { status: 404, message: 'Lesson not found' };
  return lesson;
}

export async function updateLesson(
  id: string,
  data: {
    scheduledAt?: Date;
    zoomLink?: string | null;
    recordingUrl?: string | null;
    teacherNotes?: string | null;
    status?: LessonStatus;
  }
) {
  return prisma.lesson.update({
    where: { id },
    data,
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });
}

export async function cancelLesson(id: string, cancelledById: string, cancelReason?: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw { status: 404, message: 'Lesson not found' };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.lesson.update({
      where: { id },
      data: {
        status: LessonStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledById,
        cancelReason,
      },
    });

    if (lesson.timeSlotId) {
      await tx.timeSlot.update({
        where: { id: lesson.timeSlotId },
        data: { isAvailable: true, isBooked: false },
      });
    }

    // Refund session back into student's session wallet if scheduled
    if (lesson.status === LessonStatus.SCHEDULED && lesson.sessionTypeId) {
      const balanceRec = await tx.studentSessionBalance.findUnique({
        where: {
          studentId_sessionTypeId: {
            studentId: lesson.studentId,
            sessionTypeId: lesson.sessionTypeId,
          },
        },
      });

      const newBal = (balanceRec?.balance || 0) + 1;

      await tx.studentSessionBalance.upsert({
        where: {
          studentId_sessionTypeId: {
            studentId: lesson.studentId,
            sessionTypeId: lesson.sessionTypeId,
          },
        },
        update: { balance: { increment: 1 } },
        create: {
          studentId: lesson.studentId,
          sessionTypeId: lesson.sessionTypeId,
          balance: 1,
        },
      });

      await tx.sessionBalanceLedger.create({
        data: {
          studentId: lesson.studentId,
          sessionTypeId: lesson.sessionTypeId,
          delta: 1,
          balanceAfter: newBal,
          reason: 'LESSON_REFUND',
          referenceId: lesson.id,
          createdById: cancelledById,
        },
      });
    }

    return updated;
  });
}

export async function completeLesson(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { studentPackage: true },
  });
  if (!lesson) throw { status: 404, message: 'Lesson not found' };
  if (lesson.status === LessonStatus.COMPLETED) return lesson;

  const rule = await prisma.pointRule.findUnique({
    where: { eventType: PointsEventType.LESSON_COMPLETED },
  });
  const pointsToAward = rule?.isActive ? rule.points : 50;

  return prisma.$transaction(async (tx) => {
    const updatedLesson = await tx.lesson.update({
      where: { id },
      data: { status: LessonStatus.COMPLETED },
    });

    await tx.student.update({
      where: { id: lesson.studentId },
      data: {
        totalPoints: { increment: pointsToAward },
        lastLessonAt: new Date(),
      },
    });

    await tx.pointsLedger.create({
      data: {
        studentId: lesson.studentId,
        eventType: PointsEventType.LESSON_COMPLETED,
        points: pointsToAward,
        referenceId: lesson.id,
        description: `Completed ${lesson.durationMinutes || 25}-Minute Hebrew Session`,
      },
    });

    return updatedLesson;
  });
}

export async function rescheduleLesson(
  lessonId: string,
  userId: string,
  newTimeSlotId: string,
  newScheduledAt: Date
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { student: { include: { user: true } }, teacher: { include: { user: true } } },
  });

  if (!lesson) throw { status: 404, message: 'Lesson not found' };

  return prisma.$transaction(async (tx) => {
    if (lesson.timeSlotId) {
      await tx.timeSlot.update({ where: { id: lesson.timeSlotId }, data: { isAvailable: true, isBooked: false } });
    }

    await tx.timeSlot.update({ where: { id: newTimeSlotId }, data: { isAvailable: false, isBooked: true } });

    return tx.lesson.update({
      where: { id: lessonId },
      data: {
        timeSlotId: newTimeSlotId,
        scheduledAt: newScheduledAt,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    });
  });
}

export async function saveRecording(id: string, recordingUrl: string) {
  return prisma.lesson.update({
    where: { id },
    data: { recordingUrl },
  });
}
