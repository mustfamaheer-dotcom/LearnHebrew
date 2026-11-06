import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/password';
import { Role, HebrewLevel } from '@prisma/client';
import { logAuditEvent } from '../../utils/audit';

export async function listUsers(filters: {
  role?: Role;
  search?: string;
  isActive?: boolean;
}) {
  const where: any = {};
  if (filters.role) where.role = filters.role;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      languagePref: true,
      avatarUrl: true,
      isActive: true,
      mustChangePw: true,
      createdAt: true,
      studentProfile: {
        select: {
          id: true,
          level: true,
          totalPoints: true,
          streakDays: true,
          balance: true,
          packages: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              lessonsTotal: true,
              lessonsUsed: true,
              status: true,
              package: {
                select: { id: true, name: true, nameHe: true },
              },
            },
          },
        },
      },
      teacherProfile: {
        select: {
          id: true,
          specialties: true,
          ratingAvg: true,
          ratingCount: true,
        },
      },
    },
  });

  return users;
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  languagePref?: 'en' | 'he';
  level?: HebrewLevel;
  bio?: string;
  specialties?: string[];
  createdById: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    throw { status: 400, message: 'User with this email already exists' };
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      languagePref: data.languagePref || 'en',
      createdById: data.createdById,
      mustChangePw: true,
      ...(data.role === Role.STUDENT && {
        studentProfile: {
          create: {
            level: data.level || HebrewLevel.BEGINNER,
          },
        },
      }),
      ...(data.role === Role.TEACHER && {
        teacherProfile: {
          create: {
            bio: data.bio || '',
            specialties: data.specialties || ['Modern Hebrew', 'Biblical Hebrew', 'Conversation'],
          },
        },
      }),
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
    },
  });

  await logAuditEvent({
    userId: data.createdById,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    metaJson: { email: user.email, role: user.role },
  });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
          packages: { include: { package: true } },
          lessons: { take: 10, orderBy: { scheduledAt: 'desc' } },
        },
      },
      teacherProfile: {
        include: {
          timeSlots: true,
          lessons: { take: 10, orderBy: { scheduledAt: 'desc' } },
        },
      },
    },
  });

  if (!user) throw { status: 404, message: 'User not found' };
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function updateUser(id: string, data: any) {
  const { level, notes, totalPoints, streakDays, bio, specialties, ...userData } = data;

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { studentProfile: true, teacherProfile: true },
  });
  if (!existing) throw { status: 404, message: 'User not found' };

  const hasStudentUpdates =
    level !== undefined || notes !== undefined || totalPoints !== undefined || streakDays !== undefined;
  const hasTeacherUpdates = bio !== undefined || specialties !== undefined;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      ...(hasStudentUpdates && {
        studentProfile: {
          upsert: {
            create: {
              level: level || 'BEGINNER',
              notes: notes || '',
              totalPoints: totalPoints || 0,
              streakDays: streakDays || 0,
            },
            update: {
              ...(level !== undefined && { level }),
              ...(notes !== undefined && { notes }),
              ...(totalPoints !== undefined && { totalPoints }),
              ...(streakDays !== undefined && { streakDays }),
            },
          },
        },
      }),
      ...(hasTeacherUpdates && {
        teacherProfile: {
          upsert: {
            create: {
              bio: bio || '',
              specialties: specialties || [],
            },
            update: {
              ...(bio !== undefined && { bio }),
              ...(specialties !== undefined && { specialties }),
            },
          },
        },
      }),
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
    },
  });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function forceResetPassword(id: string, newPass: string) {
  const passwordHash = await hashPassword(newPass);
  return prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePw: true },
  });
}

export async function adjustStudentBalance(
  studentIdOrUserId: string,
  amount: number,
  mode: 'add' | 'set' = 'add',
  reason?: string,
  adminUserId?: string
) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: studentIdOrUserId }, { userId: studentIdOrUserId }] },
    include: { user: true },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  return prisma.$transaction(async (tx) => {
    const currentBalance = Number(student.balance || 0);
    const newBalance = mode === 'set' ? amount : currentBalance + amount;
    if (newBalance < 0) {
      throw { status: 400, message: 'Balance cannot be negative' };
    }

    const updated = await tx.student.update({
      where: { id: student.id },
      data: { balance: newBalance },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const netAmount = mode === 'set' ? newBalance - currentBalance : amount;
    await tx.balanceTransaction.create({
      data: {
        studentId: student.id,
        amount: netAmount,
        balanceAfter: newBalance,
        type: 'ADMIN_ADJUSTMENT',
        description: reason || `Admin adjusted balance (${mode === 'set' ? 'Set to' : 'Added'} $${amount})`,
        createdById: adminUserId,
      },
    });

    await logAuditEvent({
      userId: adminUserId || 'system',
      action: 'STUDENT_BALANCE_ADJUSTED',
      entityType: 'Student',
      entityId: student.id,
      metaJson: {
        previousBalance: currentBalance,
        newBalance,
        netAmount,
        reason,
      },
    });

    return updated;
  });
}

