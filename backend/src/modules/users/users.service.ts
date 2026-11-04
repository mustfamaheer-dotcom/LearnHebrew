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
  const { level, bio, specialties, ...userData } = data;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      studentProfile: level
        ? {
            update: { level },
          }
        : undefined,
      teacherProfile: bio || specialties
        ? {
            update: {
              ...(bio && { bio }),
              ...(specialties && { specialties }),
            },
          }
        : undefined,
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

