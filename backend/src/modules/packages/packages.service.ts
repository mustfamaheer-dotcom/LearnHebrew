import { prisma } from '../../config/database';

export async function listPackages() {
  return prisma.package.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPackage(data: any) {
  return prisma.package.create({
    data: {
      name: data.name,
      nameHe: data.nameHe,
      description: data.description,
      descriptionHe: data.descriptionHe,
      totalLessons: data.totalLessons,
      validityDays: data.validityDays,
      price: data.price,
      currency: data.currency,
      isActive: true,
    },
  });
}

export async function updatePackage(id: string, data: any) {
  return prisma.package.update({
    where: { id },
    data,
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
  });
  if (!pkg) throw { status: 404, message: 'Package not found' };

  // Support student ID or User ID
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id: params.studentId }, { userId: params.studentId }],
    },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const endDate = new Date(params.startDate);
  endDate.setDate(endDate.getDate() + pkg.validityDays);

  const grantedCredits =
    params.customCredits && params.customCredits > 0
      ? params.customCredits
      : pkg.totalLessons;

  return prisma.studentPackage.create({
    data: {
      studentId: student.id,
      packageId: pkg.id,
      assignedById: params.assignedById,
      lessonsTotal: grantedCredits,
      lessonsUsed: 0,
      startDate: params.startDate,
      endDate,
      status: 'ACTIVE',
    },
    include: {
      package: true,
      student: { include: { user: true } },
    },
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

  // 1. Check if student already has an active package
  const activePackage = await prisma.studentPackage.findFirst({
    where: {
      studentId: student.id,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (activePackage) {
    return prisma.studentPackage.update({
      where: { id: activePackage.id },
      data: {
        lessonsTotal: { increment: params.credits },
      },
      include: {
        package: true,
        student: { include: { user: true } },
      },
    });
  }

  // 2. Otherwise find or create default Admin Credit Grant package
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
        validityDays: 90,
        price: 0,
        currency: 'USD',
        isActive: true,
      },
    });
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

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
