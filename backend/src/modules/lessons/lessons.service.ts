import { prisma } from '../../config/database';
import { SlotType, LessonStatus, PointsEventType } from '@prisma/client';
import { logAuditEvent } from '../../utils/audit';

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
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      },
      studentPackage: { include: { package: true } },
      homework: true,
      feedback: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });
}

export async function bookLesson(data: {
  studentId: string;
  teacherId: string;
  scheduledAt: Date;
  durationMinutes?: number;
  timeSlotId?: string;
  lessonType?: SlotType;
  zoomLink?: string;
  bookedById: string;
}) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: data.teacherId }, { userId: data.teacherId }] },
  });
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  const booker = await prisma.user.findUnique({
    where: { id: data.bookedById },
  });
  const isAdmin = booker?.role === 'ADMIN' || booker?.role === 'SUPER_ADMIN';

  // 1. Fetch Session Pricing configuration
  const pricingSetting = await prisma.systemSetting.findUnique({
    where: { key: 'session_pricing' },
  });
  const duration = data.durationMinutes || 25;
  const pricingMap: Record<string, any> = (pricingSetting?.valueJson as Record<string, any>) || {
    '25': 25,
    '40': 40,
    '55': 55,
    currency: 'USD',
  };
  const durationPrice = Number(pricingMap[String(duration)] ?? (duration === 55 ? 55 : duration === 40 ? 40 : 25));
  const currency = pricingMap.currency || 'USD';

  // 2. Balance Verification
  const studentBalance = Number(student.balance || 0);

  if (!isAdmin && studentBalance < durationPrice) {
    throw {
      status: 400,
      message: `Insufficient balance to book this ${duration}-minute session. Session cost: ${durationPrice} ${currency}, your current balance: ${studentBalance.toFixed(2)} ${currency}. Please contact the administrator to add balance.`,
      requiredPrice: durationPrice,
      currentBalance: studentBalance,
      currency,
    };
  }

  // Check if student has an active package to associate
  let activePackage = await prisma.studentPackage.findFirst({
    where: {
      studentId: student.id,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Conflict prevention: check if teacher already booked at this exact time
  const existingLesson = await prisma.lesson.findFirst({
    where: {
      teacherId: teacher.id,
      scheduledAt: data.scheduledAt,
      status: 'SCHEDULED',
    },
  });
  if (existingLesson) {
    throw { status: 409, message: 'Teacher already has a lesson scheduled at this time' };
  }

  // Database transaction: create lesson, deduct balance, mark slot unavailable
  return prisma.$transaction(async (tx) => {
    // Deduct session price from student balance
    const newBalance = Math.max(0, studentBalance - durationPrice);
    await tx.student.update({
      where: { id: student.id },
      data: { balance: newBalance },
    });

    await tx.balanceTransaction.create({
      data: {
        studentId: student.id,
        amount: -durationPrice,
        balanceAfter: newBalance,
        type: 'SESSION_BOOKING',
        description: `Booked ${duration}-Minute Session with ${teacher.userId ? 'Teacher' : ''} (${durationPrice} ${currency})`,
        createdById: data.bookedById,
      },
    });

    const lesson = await tx.lesson.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        timeSlotId: data.timeSlotId,
        studentPackageId: activePackage ? activePackage.id : undefined,
        scheduledAt: data.scheduledAt,
        durationMinutes: duration,
        lessonType: data.lessonType || SlotType.REGULAR,
        zoomLink: data.zoomLink || 'https://zoom.us/j/9876543210',
        status: LessonStatus.SCHEDULED,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    });

    // If active package exists, record usage
    if (activePackage) {
      const nextUsed = activePackage.lessonsUsed + 1;
      const isCompletedPkg = nextUsed >= activePackage.lessonsTotal;
      await tx.studentPackage.update({
        where: { id: activePackage.id },
        data: {
          lessonsUsed: nextUsed,
          status: isCompletedPkg ? 'COMPLETED' : 'ACTIVE',
        },
      });
    }

    if (data.timeSlotId) {
      await tx.timeSlot.update({
        where: { id: data.timeSlotId },
        data: { isAvailable: false },
      });
    }

    await logAuditEvent({
      userId: data.bookedById,
      action: 'LESSON_BOOKED',
      entityType: 'Lesson',
      entityId: lesson.id,
      metaJson: {
        duration,
        durationPrice,
        remainingBalance: newBalance,
      },
    });

    return lesson;
  });
}

export async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      studentPackage: { include: { package: true } },
      homework: true,
      feedback: true,
    },
  });

  if (!lesson) throw { status: 404, message: 'Lesson not found' };
  return lesson;
}

export async function updateLesson(id: string, data: any) {
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

    // Make slot available again if attached
    if (lesson.timeSlotId) {
      await tx.timeSlot.update({
        where: { id: lesson.timeSlotId },
        data: { isAvailable: true },
      });
    }

    // Refund credit to student package if previously scheduled
    if (lesson.studentPackageId && lesson.status === LessonStatus.SCHEDULED) {
      await tx.studentPackage.update({
        where: { id: lesson.studentPackageId },
        data: {
          lessonsUsed: { decrement: 1 },
          status: 'ACTIVE',
        },
      });
    }

    // Refund session fee back to student's balance if cancelled
    if (lesson.status === LessonStatus.SCHEDULED) {
      const duration = lesson.durationMinutes || 25;
      const pricingSetting = await tx.systemSetting.findUnique({
        where: { key: 'session_pricing' },
      });
      const pricingMap: Record<string, any> = (pricingSetting?.valueJson as Record<string, any>) || { '25': 25, '40': 40, '55': 55 };
      const refundAmount = Number(pricingMap[String(duration)] ?? (duration === 55 ? 55 : duration === 40 ? 40 : 25));

      const updatedStudent = await tx.student.update({
        where: { id: lesson.studentId },
        data: { balance: { increment: refundAmount } },
      });

      await tx.balanceTransaction.create({
        data: {
          studentId: lesson.studentId,
          amount: refundAmount,
          balanceAfter: updatedStudent.balance,
          type: 'SESSION_REFUND',
          description: `Refund for cancelled ${duration}-minute lesson`,
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
  if (lesson.status === LessonStatus.COMPLETED) {
    return lesson;
  }

  return prisma.$transaction(async (tx) => {
    // 1. Mark lesson completed
    const updatedLesson = await tx.lesson.update({
      where: { id },
      data: { status: LessonStatus.COMPLETED },
    });

    // 2. Award +50 points to student
    await tx.student.update({
      where: { id: lesson.studentId },
      data: {
        totalPoints: { increment: 50 },
        lastLessonAt: new Date(),
      },
    });

    await tx.pointsLedger.create({
      data: {
        studentId: lesson.studentId,
        eventType: PointsEventType.LESSON_COMPLETED,
        points: 50,
        referenceId: lesson.id,
        description: `Completed ${lesson.durationMinutes || 25}-Minute Hebrew Lesson`,
      },
    });

    return updatedLesson;
  });
}

export async function saveRecording(id: string, recordingUrl: string) {
  return prisma.lesson.update({
    where: { id },
    data: { recordingUrl },
  });
}

