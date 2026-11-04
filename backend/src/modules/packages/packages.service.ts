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

