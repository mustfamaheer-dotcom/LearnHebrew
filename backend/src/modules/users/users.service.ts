import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/password';
import { Role, HebrewLevel, LanguagePref } from '@prisma/client';
import { logAuditEvent } from '../../utils/audit';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { invalidateRolePermissionCache } from '../../middleware/permission';
import crypto from 'crypto';

export async function listUsers(filters: {
  role?: Role;
  search?: string;
  isActive?: boolean;
}) {
  const where: any = {};
  if (filters.role) where.role = filters.role;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { parent: { email: { contains: q, mode: 'insensitive' } } },
      { parent: { phone: { contains: q, mode: 'insensitive' } } },
      { parent: { firstName: { contains: q, mode: 'insensitive' } } },
      { parent: { lastName: { contains: q, mode: 'insensitive' } } },
      { children: { some: { email: { contains: q, mode: 'insensitive' } } } },
      { children: { some: { phone: { contains: q, mode: 'insensitive' } } } },
      { children: { some: { firstName: { contains: q, mode: 'insensitive' } } } },
      { children: { some: { lastName: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      parentId: true,
      isParent: true,
      familyRole: true,
      parent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      children: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          studentProfile: {
            select: {
              id: true,
              level: true,
              levelModel: true,
              totalPoints: true,
              lastLessonAt: true,
              packages: {
                include: { package: true },
                orderBy: { createdAt: 'desc' },
              },
              payments: {
                orderBy: { createdAt: 'desc' },
                take: 3,
              },
              lessons: {
                where: { status: 'SCHEDULED' },
                orderBy: { scheduledAt: 'asc' },
                take: 1,
                include: {
                  teacher: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          avatarUrl: true,
                        },
                      },
                    },
                  },
                },
              },
              sessionBalances: {
                include: { sessionType: true },
              },
            },
          },
        },
      },
      _count: {
        select: { children: true },
      },
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
          lastLessonAt: true,
          packages: {
            include: { package: true },
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          lessons: {
            where: { status: 'SCHEDULED' },
            orderBy: { scheduledAt: 'asc' },
            take: 1,
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
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
 * Creates user with Native Language and Language To Learn selections, with full Family / Child support
 */
export async function createUser(data: {
  email?: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: Role;
  roleDefinitionId?: string;
  languagePref?: 'en' | 'he' | 'ar';
  nativeLanguageId?: string;
  learningLanguageId?: string;
  levelId?: string;
  level?: HebrewLevel;
  bio?: string;
  specialties?: string[];
  createdById: string;
  parentId?: string;
  isParent?: boolean;
  familyRole?: string;
}) {
  let parentUser = null;
  if (data.parentId) {
    parentUser = await prisma.user.findUnique({
      where: { id: data.parentId },
      include: { studentProfile: true },
    });
    if (!parentUser) {
      throw { status: 404, message: 'Parent user not found' };
    }
  }

  // Resolve email: if missing and parent exists, auto-generate child email alias
  let resolvedEmail = (data.email || '').trim().toLowerCase();
  if (!resolvedEmail && parentUser) {
    const [local, domain] = parentUser.email.split('@');
    const childTag = data.firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || String(Date.now()).slice(-4);
    resolvedEmail = `${local}+${childTag}@${domain || 'engrew.com'}`;
  }

  if (!resolvedEmail) {
    throw { status: 400, message: 'Email address is required' };
  }

  const existing = await prisma.user.findUnique({
    where: { email: resolvedEmail },
  });
  if (existing) {
    throw { status: 400, message: `User with email "${resolvedEmail}" already exists` };
  }

  const resolvedPassword =
    data.password ||
    (process.env.NODE_ENV === 'production'
      ? crypto.randomBytes(16).toString('hex') + 'A1!'
      : 'Password123!');
  const passwordHash = await hashPassword(resolvedPassword);

  // Phone: if missing and parent exists, inherit parent phone with child tag or raw phone
  const resolvedPhone = data.phone?.trim() || (parentUser?.phone ? `${parentUser.phone}+${data.firstName}` : undefined);

  // Link to RoleDefinition
  let roleDef = null;
  if (data.roleDefinitionId) {
    roleDef = await prisma.roleDefinition.findUnique({
      where: { id: data.roleDefinitionId },
    });
  }

  let resolvedRole: Role = data.role || (data.parentId ? Role.STUDENT : Role.STUDENT);
  if (roleDef && Object.values(Role).includes(roleDef.name as any)) {
    resolvedRole = roleDef.name as Role;
  }

  if (!roleDef && resolvedRole) {
    roleDef = await prisma.roleDefinition.findFirst({
      where: { name: resolvedRole },
    });
  }

  // Resolve and synchronize dynamic Hebrew Proficiency Level (Level model)
  let resolvedLevelId: string | null = null;
  let resolvedLevelEnum: HebrewLevel = data.level || HebrewLevel.BEGINNER;

  if (resolvedRole === Role.STUDENT) {
    if (data.levelId) {
      const lvlRecord = await prisma.level.findUnique({ where: { id: data.levelId } });
      if (lvlRecord) {
        resolvedLevelId = lvlRecord.id;
        if (Object.values(HebrewLevel).includes(lvlRecord.code as any)) {
          resolvedLevelEnum = lvlRecord.code as HebrewLevel;
        }
      }
    } else if (data.level) {
      const lvlRecord = await prisma.level.findFirst({ where: { code: data.level } });
      if (lvlRecord) {
        resolvedLevelId = lvlRecord.id;
      }
    } else {
      const defaultLevel = await prisma.level.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      if (defaultLevel) {
        resolvedLevelId = defaultLevel.id;
        if (Object.values(HebrewLevel).includes(defaultLevel.code as any)) {
          resolvedLevelEnum = defaultLevel.code as HebrewLevel;
        }
      }
    }
  }

  // Ensure parent is flagged as parent if this is a child
  if (parentUser && (!parentUser.isParent || parentUser.familyRole !== 'PARENT')) {
    await prisma.user.update({
      where: { id: parentUser.id },
      data: { isParent: true, familyRole: parentUser.familyRole || 'PARENT' },
    });
  }

  const user = await prisma.user.create({
    data: {
      email: resolvedEmail,
      phone: resolvedPhone,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: resolvedRole,
      roleDefinitionId: roleDef?.id || null,
      languagePref: (data.languagePref as LanguagePref) || parentUser?.languagePref || 'en',
      nativeLanguageId: resolvedRole === Role.STUDENT ? (data.nativeLanguageId || parentUser?.nativeLanguageId || null) : null,
      learningLanguageId: resolvedRole === Role.STUDENT ? (data.learningLanguageId || parentUser?.learningLanguageId || null) : null,
      createdById: data.createdById,
      parentId: parentUser?.id || data.parentId || null,
      isParent: data.isParent ?? false,
      familyRole: data.familyRole || (parentUser ? 'CHILD' : data.isParent ? 'PARENT' : null),
      mustChangePw: true,
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
      ...(resolvedRole === Role.STUDENT && {
        studentProfile: {
          create: {
            levelId: resolvedLevelId,
            level: resolvedLevelEnum,
          },
        },
      }),
      ...(resolvedRole === Role.TEACHER && {
        teacherProfile: {
          create: {
            bio: data.bio || '',
            specialties: data.specialties || ['Conversational Hebrew', 'Grammar'],
          },
        },
      }),
    },
    include: {
      studentProfile: {
        include: {
          levelModel: true,
        },
      },
      teacherProfile: true,
      nativeLanguage: true,
      learningLanguage: true,
      roleDefinition: true,
      parent: true,
      children: true,
    },
  });

  await logAuditEvent({
    userId: data.createdById,
    action: data.parentId ? 'CHILD_USER_CREATED' : 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    metaJson: {
      email: user.email,
      phone: user.phone,
      role: user.role,
      parentId: user.parentId,
      familyRole: user.familyRole,
    },
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

  let resolvedLevelId = levelId;
  let resolvedLevelEnum = level;
  if (resolvedLevelId) {
    const lvlRecord = await prisma.level.findUnique({ where: { id: resolvedLevelId } });
    if (lvlRecord && Object.values(HebrewLevel).includes(lvlRecord.code as any)) {
      resolvedLevelEnum = lvlRecord.code as HebrewLevel;
    }
  } else if (level && !levelId) {
    const lvlRecord = await prisma.level.findFirst({ where: { code: level } });
    if (lvlRecord) {
      resolvedLevelId = lvlRecord.id;
    }
  }

  if (userData.role && !userData.roleDefinitionId) {
    const roleDef = await prisma.roleDefinition.findFirst({ where: { name: userData.role } });
    if (roleDef) {
      userData.roleDefinitionId = roleDef.id;
    }
  } else if (userData.roleDefinitionId) {
    const roleDef = await prisma.roleDefinition.findUnique({ where: { id: userData.roleDefinitionId } });
    if (roleDef && Object.values(Role).includes(roleDef.name as any)) {
      userData.role = roleDef.name as Role;
    }
  }

  const isTargetTeacher = userData.role === Role.TEACHER || (!userData.role && existing.role === Role.TEACHER);
  const isTargetStudent = userData.role === Role.STUDENT || (!userData.role && existing.role === Role.STUDENT);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      ...(existing.studentProfile ? {
        studentProfile: {
          update: {
            ...(resolvedLevelId !== undefined && { levelId: resolvedLevelId }),
            ...(resolvedLevelEnum !== undefined && { level: resolvedLevelEnum }),
            ...(notes !== undefined && { notes }),
            ...(totalPoints !== undefined && { totalPoints }),
            ...(streakDays !== undefined && { streakDays }),
          },
        },
      } : isTargetStudent ? {
        studentProfile: {
          create: {
            ...(resolvedLevelId && { levelId: resolvedLevelId }),
            level: resolvedLevelEnum || HebrewLevel.BEGINNER,
            notes: notes || '',
            totalPoints: totalPoints || 0,
            streakDays: streakDays || 0,
          },
        },
      } : {}),
      ...(existing.teacherProfile ? {
        teacherProfile: {
          update: {
            ...(bio !== undefined && { bio }),
            ...(specialties !== undefined && { specialties }),
          },
        },
      } : isTargetTeacher ? {
        teacherProfile: {
          create: {
            bio: bio || '',
            specialties: specialties || [],
          },
        },
      } : {}),
    },
    include: {
      studentProfile: {
        include: {
          levelModel: true,
        },
      },
      teacherProfile: true,
      nativeLanguage: true,
      learningLanguage: true,
      roleDefinition: true,
    },
  });

  if (userData.role && userData.role !== existing.role) {
    await invalidateRolePermissionCache(existing.role);
    await invalidateRolePermissionCache(userData.role);
  }

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

export async function getFamilyForUser(userId: string) {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      parentId: true,
      isParent: true,
      familyRole: true,
      role: true,
    },
  });

  if (!current) throw { status: 404, message: 'User not found' };

  // Determine root parent ID
  const effectiveParentId = current.parentId || current.id;

  const parent = await prisma.user.findUnique({
    where: { id: effectiveParentId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      isParent: true,
      familyRole: true,
      languagePref: true,
      studentProfile: {
        include: {
          levelModel: true,
          sessionBalances: { include: { sessionType: true } },
          packages: { include: { package: true } },
        },
      },
    },
  });

  const children = await prisma.user.findMany({
    where: { parentId: effectiveParentId, isActive: true },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      isParent: true,
      familyRole: true,
      languagePref: true,
      studentProfile: {
        include: {
          levelModel: true,
          sessionBalances: { include: { sessionType: true } },
          packages: { include: { package: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const hasFamily = Boolean((parent && parent.isParent) || children.length > 0 || current.parentId);

  return {
    hasFamily,
    parentId: effectiveParentId,
    parent,
    children,
    members: parent ? [parent, ...children] : children,
  };
}

export async function linkFamily(parentId: string, childUserId: string, familyRole?: string) {
  if (parentId === childUserId) {
    throw { status: 400, message: 'Cannot link a user to themselves' };
  }
  const parent = await prisma.user.findUnique({ where: { id: parentId } });
  if (!parent) throw { status: 404, message: 'Parent user not found' };

  await prisma.user.update({
    where: { id: parentId },
    data: { isParent: true, familyRole: parent.familyRole || 'PARENT' },
  });

  const updatedChild = await prisma.user.update({
    where: { id: childUserId },
    data: {
      parentId,
      familyRole: familyRole || 'CHILD',
    },
  });

  await logAuditEvent({
    userId: parentId,
    action: 'FAMILY_LINKED',
    entityType: 'User',
    entityId: childUserId,
    metaJson: { parentId, childUserId, familyRole: familyRole || 'CHILD' },
  });

  return updatedChild;
}

export async function unlinkFamily(childUserId: string) {
  const child = await prisma.user.findUnique({ where: { id: childUserId } });
  if (!child) throw { status: 404, message: 'User not found' };

  const updatedChild = await prisma.user.update({
    where: { id: childUserId },
    data: {
      parentId: null,
      familyRole: null,
    },
  });

  await logAuditEvent({
    userId: childUserId,
    action: 'FAMILY_UNLINKED',
    entityType: 'User',
    entityId: childUserId,
    metaJson: { previousParentId: child.parentId },
  });

  return updatedChild;
}

export async function switchFamilyProfile(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        studentProfile: { include: { levelModel: true } },
        teacherProfile: true,
        parent: true,
        children: true,
      },
    });
    if (!user) throw { status: 404, message: 'User not found' };
    const { passwordHash: _, ...safeUser } = user;
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user: safeUser };
  }

  // Verify that current user and target user belong to the same family
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { id: true, parentId: true, isParent: true },
  });
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      studentProfile: { include: { levelModel: true } },
      teacherProfile: true,
      parent: true,
      children: true,
    },
  });

  if (!currentUser || !targetUser) {
    throw { status: 404, message: 'User not found' };
  }

  const isParentOfTarget = currentUser.id === targetUser.parentId;
  const isChildOfTarget = currentUser.parentId === targetUser.id;
  const isSiblingOfTarget = Boolean(currentUser.parentId && currentUser.parentId === targetUser.parentId);

  if (!isParentOfTarget && !isChildOfTarget && !isSiblingOfTarget) {
    throw { status: 403, message: 'Unauthorized: target user is not part of your family account' };
  }

  const token = generateAccessToken({
    userId: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
  });

  const { passwordHash: _, ...safeUser } = targetUser;
  return { token, user: safeUser };
}

