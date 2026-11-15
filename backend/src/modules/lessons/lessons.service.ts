import { prisma } from '../../config/database';
import { Prisma, SlotType, LessonStatus, AttendanceStatus, PointsEventType } from '@prisma/client';
import { logAuditEvent } from '../../utils/audit';
import { notificationService } from '../notifications/notifications.service';
import { cacheInvalidatePrefix } from '../../lib/cache';

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

    cacheInvalidatePrefix('teachers');

    return lesson;
  });
}

/**
 * Book Fixed Weekly Recurring Lessons (Regular Booking):
 * Automatically books recurring weekly slots across 4 weeks for the month.
 * Validates maximum allowed weekly slots based on monthly package:
 *   - 4 sessions/month -> Max 1 weekly regular slot (4 total)
 *   - 8 sessions/month -> Max 2 weekly regular slots (8 total)
 *   - 12 sessions/month -> Max 3 weekly regular slots (12 total)
 *   - 16 sessions/month -> Max 4 weekly regular slots (16 total)
 * Validates collision across all target dates and deducts sessions from balance.
 */
export async function bookRegularLessons(data: {
  studentId: string;
  teacherId: string;
  sessionTypeId?: string;
  durationMinutes?: number;
  recurringSlots: Array<{
    dayOfWeek: number; // 0=Sun..6=Sat
    startTime: string; // "HH:mm" e.g. "10:00"
  }>;
  zoomLink?: string;
  bookedById: string;
  weeksCount?: number; // default 4 weeks
}) {
  const weeksCount = data.weeksCount && data.weeksCount > 0 ? data.weeksCount : 4;

  if (!data.recurringSlots || data.recurringSlots.length === 0) {
    throw { status: 400, message: 'Please select at least one weekly regular slot.' };
  }

  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
    include: {
      user: true,
      packages: {
        where: { status: 'ACTIVE' },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      },
    },
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

  // 1. Calculate Maximum Allowed Regular Slots per week according to Package (4, 8, 12, 16)
  const activeStudentPkg = student.packages?.[0];
  const pkgTotalLessons = activeStudentPkg?.package?.totalLessons || activeStudentPkg?.lessonsTotal || 0;

  let maxWeeklyRegularSlots = 1;
  if (pkgTotalLessons >= 16) {
    maxWeeklyRegularSlots = 4;
  } else if (pkgTotalLessons >= 12) {
    maxWeeklyRegularSlots = 3;
  } else if (pkgTotalLessons >= 8) {
    maxWeeklyRegularSlots = 2;
  } else if (pkgTotalLessons >= 4) {
    maxWeeklyRegularSlots = 1;
  } else {
    // If no active package, check total available sessions
    const allBalances = await prisma.studentSessionBalance.findMany({ where: { studentId: student.id } });
    const totalAvail = allBalances.reduce((sum, b) => sum + (b.balance || 0), 0);
    maxWeeklyRegularSlots = Math.min(4, Math.max(1, Math.floor(totalAvail / 4)));
  }

  if (!isPrivileged && data.recurringSlots.length > maxWeeklyRegularSlots) {
    throw {
      status: 400,
      message: `Your monthly package (${pkgTotalLessons || 'custom'} sessions) allows a maximum of ${maxWeeklyRegularSlots} regular slot(s) per week (total ${maxWeeklyRegularSlots * weeksCount} sessions per month). You selected ${data.recurringSlots.length} weekly slots.`,
    };
  }

  // 2. Resolve SessionType & Duration
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

  // 3. Validate Balance
  const totalLessonsToBook = data.recurringSlots.length * weeksCount;
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

  const currentBalance = userSessionBalance?.balance || 0;
  if (!isPrivileged) {
    if (currentBalance < totalLessonsToBook) {
      throw {
        status: 400,
        message: `Insufficient session balance for regular booking. Booking ${data.recurringSlots.length} weekly slot(s) across ${weeksCount} weeks requires ${totalLessonsToBook} sessions, but your current balance is ${currentBalance}. Please book one-time lessons or top up your package.`,
      };
    }
  }

  // 4. Calculate All Target Dates (Weeks 1 to weeksCount for each recurring slot)
  const now = new Date();
  const targetSessions: Array<{ scheduledAt: Date; dayOfWeek: number; startTime: string }> = [];

  for (const slot of data.recurringSlots) {
    const [h, m] = slot.startTime.split(':').map(Number);
    // Find first occurrence
    const currentDay = now.getDay();
    let daysUntilFirst = (slot.dayOfWeek - currentDay + 7) % 7;
    
    // Check if first occurrence is today, but within 2 hours or in the past
    if (daysUntilFirst === 0) {
      const todaySlotTime = new Date(now);
      todaySlotTime.setHours(h, m, 0, 0);
      if (todaySlotTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
        daysUntilFirst = 7; // schedule starts next week
      }
    }

    const firstOccurrence = new Date(now);
    firstOccurrence.setDate(now.getDate() + daysUntilFirst);
    firstOccurrence.setHours(h, m, 0, 0);

    for (let w = 0; w < weeksCount; w++) {
      const weekDate = new Date(firstOccurrence);
      weekDate.setDate(firstOccurrence.getDate() + w * 7);
      targetSessions.push({
        scheduledAt: weekDate,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
      });
    }
  }

  // 5. Conflict Prevention across ALL generated dates
  const minDate = new Date(Math.min(...targetSessions.map((s) => s.scheduledAt.getTime())) - 2 * 60 * 60 * 1000);
  const maxDate = new Date(Math.max(...targetSessions.map((s) => s.scheduledAt.getTime())) + 2 * 60 * 60 * 1000);

  const existingLessons = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      status: 'SCHEDULED',
      scheduledAt: { gte: minDate, lte: maxDate },
    },
  });

  for (const target of targetSessions) {
    const tStart = target.scheduledAt.getTime();
    const tEnd = tStart + duration * 60 * 1000;

    const conflict = existingLessons.find((l) => {
      const lStart = new Date(l.scheduledAt).getTime();
      const lEnd = lStart + (l.durationMinutes || 25) * 60 * 1000;
      return tStart < lEnd && tEnd > lStart;
    });

    if (conflict) {
      const conflictDateStr = target.scheduledAt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      throw {
        status: 409,
        message: `Schedule conflict: Teacher already has a lesson booked on ${conflictDateStr} at ${target.startTime}. Please select an alternative regular slot.`,
      };
    }
  }

  // 6. Execute Transaction
  return prisma.$transaction(async (tx) => {
    if (userSessionBalance && userSessionBalance.balance >= totalLessonsToBook && sessionType) {
      const newBal = userSessionBalance.balance - totalLessonsToBook;
      await tx.studentSessionBalance.update({
        where: { id: userSessionBalance.id },
        data: { balance: newBal },
      });

      await tx.sessionBalanceLedger.create({
        data: {
          studentId: student.id,
          sessionTypeId: sessionType.id,
          delta: -totalLessonsToBook,
          balanceAfter: newBal,
          reason: 'REGULAR_WEEKLY_BOOKING',
          createdById: data.bookedById,
        },
      });
    }

    const resolvedZoomLink =
      data.zoomLink?.trim() || teacher.defaultZoomLink || 'https://zoom.us/j/engrew-live';

    const createdLessons = [];
    for (const target of targetSessions) {
      const slotDateOnly = new Date(target.scheduledAt);
      slotDateOnly.setHours(0, 0, 0, 0);

      const matchingSlot = await tx.timeSlot.findFirst({
        where: {
          teacherId: teacher.id,
          startTime: target.startTime,
          OR: [
            { date: slotDateOnly },
            { dayOfWeek: target.dayOfWeek, date: null },
          ],
        },
      });

      if (matchingSlot && matchingSlot.date) {
        await tx.timeSlot.update({
          where: { id: matchingSlot.id },
          data: { isBooked: true, isAvailable: false },
        });
      }

      const lesson = await tx.lesson.create({
        data: {
          studentId: student.id,
          teacherId: teacher.id,
          timeSlotId: matchingSlot?.id,
          sessionTypeId: sessionType?.id,
          scheduledAt: target.scheduledAt,
          durationMinutes: duration,
          lessonType: SlotType.REGULAR,
          zoomLink: resolvedZoomLink,
          status: LessonStatus.SCHEDULED,
        },
        include: {
          student: { include: { user: true } },
          teacher: { include: { user: true } },
          sessionType: true,
        },
      });
      createdLessons.push(lesson);
    }

    await logAuditEvent({
      userId: data.bookedById,
      action: 'REGULAR_LESSONS_BOOKED',
      entityType: 'Lesson',
      entityId: createdLessons[0]?.id || 'bulk',
      metaJson: {
        totalLessons: createdLessons.length,
        slotsCount: data.recurringSlots.length,
        weeksCount,
        maxWeeklyAllowed: maxWeeklyRegularSlots,
      },
    });

    cacheInvalidatePrefix('teachers');

    return {
      message: `Successfully booked ${createdLessons.length} regular lessons across ${weeksCount} weeks!`,
      totalLessons: createdLessons.length,
      weeksCount,
      maxWeeklyAllowed: maxWeeklyRegularSlots,
      lessons: createdLessons,
    };
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
      title: isAttended ? 'Attendance Confirmed' : 'Marked Absent',
      titleEn: isAttended ? 'Attendance Confirmed' : 'Marked Absent',
      titleHe: isAttended ? 'נוכחותך בשיעור אושרה בהצלחה' : 'סומנת כנעדר מהשיעור',
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
