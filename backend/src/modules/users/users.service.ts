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
      nativeLanguageId: true,
      learningLanguageId: true,
      nativeLanguage: true,
      learningLanguage: true,
      roleDefinition: true,
      avatarUrl: true,
      isActive: true,
      mustChangePw: true,
      createdAt: true,
      studentProfile: {
        select: {
          id: true,
          levelId: true,
          levelModel: true,
          level: true,
          totalPoints: true,
          streakDays: true,
          sessionBalances: {
            include: { sessionType: true },
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

/**
 * Creates user with Native Language and Language To Learn selections
 */
export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  languagePref?: 'en' | 'he';
  nativeLanguageId?: string;
  learningLanguageId?: string;
  levelId?: string;
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

  // Link to RoleDefinition
  const roleDef = await prisma.roleDefinition.findFirst({
    where: { name: data.role },
  });

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      roleDefinitionId: roleDef?.id,
      languagePref: data.languagePref || 'en',
      nativeLanguageId: data.nativeLanguageId || null,
      learningLanguageId: data.learningLanguageId || null,
      createdById: data.createdById,
      mustChangePw: true,
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
      ...(data.role === Role.STUDENT && {
        studentProfile: {
          create: {
            levelId: data.levelId || null,
            level: data.level || HebrewLevel.BEGINNER,
          },
        },
      }),
      ...(data.role === Role.TEACHER && {
        teacherProfile: {
          create: {
            bio: data.bio || '',
            specialties: data.specialties || ['Conversational Hebrew', 'Grammar'],
          },
        },
      }),
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
      nativeLanguage: true,
      learningLanguage: true,
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
      nativeLanguage: true,
      learningLanguage: true,
      notificationPreference: true,
      studentProfile: {
        include: {
          levelModel: true,
          sessionBalances: { include: { sessionType: true } },
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
  const { levelId, level, notes, totalPoints, streakDays, bio, specialties, ...userData } = data;

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { studentProfile: true, teacherProfile: true },
  });
  if (!existing) throw { status: 404, message: 'User not found' };

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      ...(existing.studentProfile && {
        studentProfile: {
          update: {
            ...(levelId !== undefined && { levelId }),
            ...(level !== undefined && { level }),
            ...(notes !== undefined && { notes }),
            ...(totalPoints !== undefined && { totalPoints }),
            ...(streakDays !== undefined && { streakDays }),
          },
        },
      }),
      ...(existing.teacherProfile && {
        teacherProfile: {
          update: {
            ...(bio !== undefined && { bio }),
            ...(specialties !== undefined && { specialties }),
          },
        },
      }),
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
      nativeLanguage: true,
      learningLanguage: true,
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

export async function updateNotificationPreferences(
  userId: string,
  data: {
    reminder24hEnabled?: boolean;
    reminder1hEnabled?: boolean;
    reminder24hMinutes?: number;
    reminder1hMinutes?: number;
    mutedCategories?: string[];
  }
) {
  return prisma.userNotificationPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}
