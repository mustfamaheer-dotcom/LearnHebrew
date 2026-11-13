import { prisma } from '../../config/database';
import { PaymentStatus } from '@prisma/client';
import { logAuditEvent } from '../../utils/audit';

export async function listPayments(filters: {
  studentId?: string;
  createdById?: string;
  status?: PaymentStatus;
}) {
  const where: any = {};
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.createdById) where.createdById = filters.createdById;
  if (filters.status) where.status = filters.status;

  return prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      package: {
        include: {
          sessionItems: { include: { sessionType: true } },
        },
      },
      createdBy: {
        select: { firstName: true, lastName: true, role: true, email: true },
      },
      approvedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });
}

export async function createPaymentWithScreenshot(data: {
  studentId: string;
  packageId: string;
  createdById: string;
  screenshotUrl: string;
  screenshotOriginalName?: string;
  notes?: string;
}) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
  });
  if (!student) throw { status: 404, message: 'Student profile not found' };

  const pkg = await prisma.package.findUnique({
    where: { id: data.packageId },
    include: { sessionItems: true },
  });
  if (!pkg || !pkg.isActive) throw { status: 404, message: 'Package not available' };

  const payment = await prisma.payment.create({
    data: {
      studentId: student.id,
      packageId: pkg.id,
      createdById: data.createdById,
      screenshotUrl: data.screenshotUrl,
      screenshotOriginalName: data.screenshotOriginalName,
      notes: data.notes,
      status: PaymentStatus.PENDING,
    },
    include: {
      package: true,
      student: { include: { user: true } },
    },
  });

  return payment;
}

/**
 * Approves a payment proof, activates student package and credits session wallets
 * strictly abiding by maximum 30 days validity constraint.
 */
export async function approvePayment(paymentId: string, approvedById: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      package: { include: { sessionItems: true } },
      student: { include: { user: true } },
    },
  });

  if (!payment) throw { status: 404, message: 'Payment record not found' };
  if (payment.status !== PaymentStatus.PENDING) {
    throw { status: 400, message: `Payment is already ${payment.status}` };
  }

  const startDate = new Date();
  const validityDays = Math.min(payment.package.validityDays || 30, 30); // Max 30 days rule
  const endDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

  // Compute total sessions
  const totalLessons = payment.package.sessionItems.reduce(
    (acc, curr) => acc + curr.quantity,
    0
  );

  return prisma.$transaction(async (tx) => {
    // 1. Update Payment
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },
    });

    // 2. Create StudentPackage
    const studentPackage = await tx.studentPackage.create({
      data: {
        studentId: payment.studentId,
        packageId: payment.packageId,
        assignedById: approvedById,
        paymentId: payment.id,
        lessonsTotal: totalLessons,
        lessonsUsed: 0,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });

    // 3. For each session item in package, increment student session wallet & log ledger
    for (const item of payment.package.sessionItems) {
      const existingBalance = await tx.studentSessionBalance.findUnique({
        where: {
          studentId_sessionTypeId: {
            studentId: payment.studentId,
            sessionTypeId: item.sessionTypeId,
          },
        },
      });

      const newBalance = (existingBalance?.balance || 0) + item.quantity;

      await tx.studentSessionBalance.upsert({
        where: {
          studentId_sessionTypeId: {
            studentId: payment.studentId,
            sessionTypeId: item.sessionTypeId,
          },
        },
        update: {
          balance: { increment: item.quantity },
          expiresAt: endDate,
        },
        create: {
          studentId: payment.studentId,
          sessionTypeId: item.sessionTypeId,
          balance: item.quantity,
          expiresAt: endDate,
        },
      });

      await tx.sessionBalanceLedger.create({
        data: {
          studentId: payment.studentId,
          sessionTypeId: item.sessionTypeId,
          delta: item.quantity,
          balanceAfter: newBalance,
          reason: 'PACKAGE_ACTIVATION',
          referenceId: studentPackage.id,
          createdById: approvedById,
        },
      });
    }

    // 4. Notify student
    await tx.notification.create({
      data: {
        userId: payment.student.userId,
        type: 'PACKAGE_ACTIVATED',
        title: 'Session Package Activated! 🚀',
        titleEn: 'Session Package Activated! 🚀',
        titleHe: 'חבילת השיעורים שלך הופעלה בהצלחה!',
        body: `Your "${payment.package.name}" is now active with ${totalLessons} sessions valid until ${endDate.toLocaleDateString()}.`,
        bodyEn: `Your "${payment.package.name}" is now active with ${totalLessons} sessions valid until ${endDate.toLocaleDateString()}.`,
        bodyHe: `חבילת "${payment.package.nameHe}" הופעלה בהצלחה עם ${totalLessons} שיעורים בתוקף ל-30 יום.`,
      },
    });

    return { payment: updatedPayment, studentPackage };
  });
}

export async function rejectPayment(paymentId: string, approvedById: string, reason?: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.REJECTED,
      approvedById,
      rejectedReason: reason || 'Screenshot or proof rejected by admin',
    },
  });
  return payment;
}
