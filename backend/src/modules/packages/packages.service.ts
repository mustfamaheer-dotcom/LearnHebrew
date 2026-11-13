import { prisma } from '../../config/database';

export async function listPackages() {
  return prisma.package.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sessionItems: {
        include: { sessionType: true },
      },
    },
  });
}

export async function createPackage(data: any) {
  const items = data.sessionItems || [];
  const totalLessons = items.length > 0 
    ? items.reduce((acc: number, curr: any) => acc + Number(curr.quantity), 0)
    : (Number(data.totalLessons) || 0);

  const validityDays = Math.min(Number(data.validityDays) || 30, 30);

  return prisma.package.create({
    data: {
      name: data.name,
      nameHe: data.nameHe,
      description: data.description,
      descriptionHe: data.descriptionHe,
      totalLessons,
      validityDays,
      price: data.price ? Number(data.price) : 0,
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      onSale: Boolean(data.onSale || (data.originalPrice && Number(data.originalPrice) > Number(data.price))),
      currency: data.currency || 'USD',
      isActive: true,
      ...(items.length > 0 && {
        sessionItems: {
          create: items.map((item: any) => ({
            sessionTypeId: item.sessionTypeId,
            quantity: Number(item.quantity),
          })),
        },
      }),
    },
    include: {
      sessionItems: { include: { sessionType: true } },
    },
  });
}

export async function updatePackage(id: string, data: any) {
  const validityDays = data.validityDays ? Math.min(Number(data.validityDays), 30) : undefined;

  return prisma.$transaction(async (tx) => {
    if (data.sessionItems) {
      await tx.packageSessionItem.deleteMany({ where: { packageId: id } });
      await tx.packageSessionItem.createMany({
        data: data.sessionItems.map((si: any) => ({
          packageId: id,
          sessionTypeId: si.sessionTypeId,
          quantity: Number(si.quantity),
        })),
      });
    }

    const price = data.price !== undefined ? Number(data.price) : undefined;
    const originalPrice = data.originalPrice !== undefined ? (data.originalPrice ? Number(data.originalPrice) : null) : undefined;
    const onSale = data.onSale !== undefined ? Boolean(data.onSale) : undefined;
    const totalLessons = data.sessionItems
      ? data.sessionItems.reduce((acc: number, curr: any) => acc + Number(curr.quantity), 0)
      : (data.totalLessons !== undefined ? Number(data.totalLessons) : undefined);

    return tx.package.update({
      where: { id },
      data: {
        name: data.name,
        nameHe: data.nameHe,
        description: data.description,
        descriptionHe: data.descriptionHe,
        totalLessons,
        validityDays,
        price,
        originalPrice,
        onSale,
        currency: data.currency,
        isActive: data.isActive,
      },
      include: {
        sessionItems: { include: { sessionType: true } },
      },
    });
  });
}

export async function deletePackage(id: string) {
  return prisma.package.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function assignPackageToStudent(params: {
  packageId: string;
  studentId: string;
  assignedById: string;
  startDate: Date;
  customCredits?: number;
}) {
  const pkg = await prisma.package.findUnique({
    where: { id: params.packageId },
    include: { sessionItems: true },
  });
  if (!pkg) throw { status: 404, message: 'Package not found' };

  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id: params.studentId }, { userId: params.studentId }],
    },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const startDate = params.startDate ? new Date(params.startDate) : new Date();
  const validityDays = Math.min(pkg.validityDays || 30, 30);
  const endDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

  const grantedCredits =
    params.customCredits && params.customCredits > 0
      ? params.customCredits
      : (pkg.sessionItems.length > 0 ? pkg.sessionItems.reduce((acc, curr) => acc + curr.quantity, 0) : pkg.totalLessons);

  return prisma.$transaction(async (tx) => {
    const studentPackage = await tx.studentPackage.create({
      data: {
        studentId: student.id,
        packageId: pkg.id,
        assignedById: params.assignedById,
        lessonsTotal: grantedCredits,
        lessonsUsed: 0,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        package: true,
        student: { include: { user: true } },
      },
    });

    // Credit session balances
    if (pkg.sessionItems.length > 0) {
      for (const item of pkg.sessionItems) {
        const existing = await tx.studentSessionBalance.findUnique({
          where: {
            studentId_sessionTypeId: {
              studentId: student.id,
              sessionTypeId: item.sessionTypeId,
            },
          },
        });
        const newBal = (existing?.balance || 0) + item.quantity;
        await tx.studentSessionBalance.upsert({
          where: {
            studentId_sessionTypeId: {
              studentId: student.id,
              sessionTypeId: item.sessionTypeId,
            },
          },
          update: { balance: { increment: item.quantity }, expiresAt: endDate },
          create: {
            studentId: student.id,
            sessionTypeId: item.sessionTypeId,
            balance: item.quantity,
            expiresAt: endDate,
          },
        });
        await tx.sessionBalanceLedger.create({
          data: {
            studentId: student.id,
            sessionTypeId: item.sessionTypeId,
            delta: item.quantity,
            balanceAfter: newBal,
            reason: 'PACKAGE_ACTIVATION',
            referenceId: studentPackage.id,
            createdById: params.assignedById,
          },
        });
      }
    }

    return studentPackage;
  });
}

export async function grantStudentCredits(params: {
  studentId: string;
  credits: number;
  reason?: string;
  assignedById: string;
}) {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id: params.studentId }, { userId: params.studentId }],
    },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  let defaultPkg = await prisma.package.findFirst({
    where: { name: 'Admin Credit Grant' },
  });
  if (!defaultPkg) {
    defaultPkg = await prisma.package.create({
      data: {
        name: 'Admin Credit Grant',
        nameHe: 'הקצאת קרדיטים מותאמת אישית',
        description: 'Direct session credits granted by administration',
        descriptionHe: 'קרדיטים לשיעורים שהוענקו ישירות על ידי ההנהלה',
        totalLessons: params.credits,
        validityDays: 30,
        price: 0,
        currency: 'USD',
        isActive: true,
      },
    });
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  return prisma.studentPackage.create({
    data: {
      studentId: student.id,
      packageId: defaultPkg.id,
      assignedById: params.assignedById,
      lessonsTotal: params.credits,
      lessonsUsed: 0,
      startDate,
      endDate,
      status: 'ACTIVE',
    },
    include: {
      package: true,
      student: { include: { user: true } },
    },
  });
}

export async function validateCoupon(code: string, purchaseAmount: number) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    throw { status: 400, message: 'Invalid or inactive coupon code' };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    throw { status: 400, message: 'This coupon code has expired' };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw { status: 400, message: 'This coupon has reached its maximum usage limit' };
  }

  if (coupon.minSpend && purchaseAmount < Number(coupon.minSpend)) {
    throw {
      status: 400,
      message: `Minimum purchase of $${Number(coupon.minSpend).toFixed(2)} required to use this coupon`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENT') {
    discountAmount = (purchaseAmount * Number(coupon.discountValue)) / 100;
  } else {
    discountAmount = Math.min(Number(coupon.discountValue), purchaseAmount);
  }

  const finalAmount = Math.max(0, purchaseAmount - discountAmount);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),
    description: coupon.description,
    descriptionHe: coupon.descriptionHe,
  };
}

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCoupon(data: {
  code: string;
  discountType?: string;
  discountValue: number;
  minSpend?: number;
  maxUses?: number;
  expiresAt?: Date | string;
  description?: string;
  descriptionHe?: string;
}) {
  return prisma.coupon.create({
    data: {
      code: data.code.trim().toUpperCase(),
      discountType: data.discountType || 'PERCENT',
      discountValue: data.discountValue,
      minSpend: data.minSpend ?? null,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      description: data.description || null,
      descriptionHe: data.descriptionHe || null,
      isActive: true,
    },
  });
}

export async function deleteCoupon(id: string) {
  return prisma.coupon.delete({
    where: { id },
  });
}
