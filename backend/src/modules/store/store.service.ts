import {
  CoinTransactionType,
  NotificationCategory,
  NotificationPriority,
  Prisma,
  StoreItemRarity,
  StoreItemType,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { notificationService } from '../notifications/notifications.service';

export interface StoreItemFilters {
  type?: StoreItemType;
  rarity?: StoreItemRarity;
  maxCost?: number;
  activeOnly?: boolean;
}

export interface CreateStoreItemInput {
  type: StoreItemType;
  rarity?: StoreItemRarity;
  isActive?: boolean;
  sortOrder?: number;
  coinCost: number;
  nameEn: string;
  nameHe: string;
  nameAr: string;
  descEn?: string | null;
  descHe?: string | null;
  descAr?: string | null;
  frameImageUrl?: string | null;
  frameAnimated?: boolean;
  frameCssClass?: string | null;
  frameBorderColor?: string | null;
  frameBorderRadius?: string | null;
  nicknameColor?: string | null;
  nicknameGlow?: boolean;
  nicknameGlowColor?: string | null;
  nicknameFont?: string | null;
  nicknameBadgeIcon?: string | null;
  nicknameCssClass?: string | null;
}

export type UpdateStoreItemInput = Partial<CreateStoreItemInput>;

export interface TransactionFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  type?: CoinTransactionType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Awards coins when a student's totalPoints crosses a 100-point milestone.
 * Every 100 totalPoints -> 10 coins.
 */
export async function awardCoinsForPoints(
  studentId: string,
  previousPoints: number,
  newPoints: number,
  tx?: Prisma.TransactionClient
): Promise<number> {
  if (newPoints <= previousPoints) return 0;

  const previousCoins = Math.floor(previousPoints / 100) * 10;
  const newCoins = Math.floor(newPoints / 100) * 10;
  const coinsToAward = newCoins - previousCoins;

  if (coinsToAward <= 0) return 0;

  const db = tx ?? prisma;

  const updatedStudent = await db.student.update({
    where: { id: studentId },
    data: { coins: { increment: coinsToAward } },
    select: { coins: true },
  });

  await db.coinTransaction.create({
    data: {
      studentId,
      amount: coinsToAward,
      coinsAfter: updatedStudent.coins,
      type: CoinTransactionType.EARNED_FROM_POINTS,
      description: `Earned ${coinsToAward} coins for reaching ${newPoints} total points`,
    },
  });

  return coinsToAward;
}

async function getStudentByUserIdOrThrow(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, userId: true, coins: true },
  });
  if (!student) {
    throw { status: 404, message: 'Student profile not found' };
  }
  return student;
}

export async function listStoreItems(filters: StoreItemFilters = {}) {
  const where: Prisma.StoreItemWhereInput = {};

  if (filters.activeOnly !== false) {
    where.isActive = true;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.rarity) {
    where.rarity = filters.rarity;
  }
  if (filters.maxCost !== undefined && !Number.isNaN(filters.maxCost)) {
    where.coinCost = { lte: filters.maxCost };
  }

  return prisma.storeItem.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { coinCost: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getStoreItemById(id: string) {
  const item = await prisma.storeItem.findUnique({ where: { id } });
  if (!item) {
    throw { status: 404, message: 'Store item not found' };
  }
  return item;
}

export async function getMyCoins(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, userId: true, coins: true },
  });

  if (!student) {
    return {
      coins: 0,
      transactions: [],
      totalEarned: 0,
      totalSpent: 0,
    };
  }

  const [transactions, earnedAgg, spentAgg] = await Promise.all([
    prisma.coinTransaction.findMany({
      where: { studentId: student.id },
      include: { storeItem: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.coinTransaction.aggregate({
      where: { studentId: student.id, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.coinTransaction.aggregate({
      where: { studentId: student.id, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
  ]);

  return {
    coins: student.coins,
    transactions,
    totalEarned: earnedAgg._sum.amount ?? 0,
    totalSpent: Math.abs(spentAgg._sum.amount ?? 0),
  };
}

export async function getMyInventory(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  return prisma.studentStoreItem.findMany({
    where: { studentId: student.id },
    include: { storeItem: true },
    orderBy: { redeemedAt: 'desc' },
  });
}

export async function redeemItem(userId: string, storeItemId: string) {
  const studentRecord = await getStudentByUserIdOrThrow(userId);

  const result = await prisma.$transaction(async (tx) => {
    const [student, item, existing] = await Promise.all([
      tx.student.findUnique({
        where: { id: studentRecord.id },
        select: { id: true, userId: true, coins: true },
      }),
      tx.storeItem.findUnique({ where: { id: storeItemId } }),
      tx.studentStoreItem.findUnique({
        where: {
          studentId_storeItemId: {
            studentId: studentRecord.id,
            storeItemId,
          },
        },
      }),
    ]);

    if (!student) {
      throw { status: 404, message: 'Student profile not found' };
    }
    if (!item || !item.isActive) {
      throw { status: 404, message: 'Store item not found or inactive' };
    }
    if (existing) {
      throw { status: 409, message: 'You already own this item' };
    }
    if (student.coins < item.coinCost) {
      throw { status: 400, message: 'Insufficient coins to redeem this item' };
    }

    const coinsAfter = student.coins - item.coinCost;

    await tx.student.update({
      where: { id: student.id },
      data: { coins: coinsAfter },
    });

    await tx.studentStoreItem.create({
      data: {
        studentId: student.id,
        storeItemId: item.id,
      },
    });

    await tx.coinTransaction.create({
      data: {
        studentId: student.id,
        amount: -item.coinCost,
        coinsAfter,
        type: CoinTransactionType.REDEEMED_ITEM,
        referenceId: item.id,
        description: `Redeemed: ${item.nameEn}`,
      },
    });

    return { success: true, coinsAfter, item, studentUserId: student.userId };
  });

  // Non-blocking notification
  notificationService
    .createNotification({
      userId: result.studentUserId,
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.NORMAL,
      type: 'STORE_REDEMPTION',
      titleEn: '🎉 Redemption Successful!',
      titleHe: '🎉 המימוש הצליח!',
      bodyEn: `You redeemed "${result.item.nameEn}"! Coins remaining: ${result.coinsAfter}`,
      bodyHe: `מימשת את "${result.item.nameHe}"! מטבעות שנותרו: ${result.coinsAfter}`,
      actionUrl: '/student?tab=store',
      metaJson: { storeItemId: result.item.id, coinsAfter: result.coinsAfter },
    })
    .catch((err) => console.error('[Store.redeemItem notification error]', err));

  return {
    success: result.success,
    coinsAfter: result.coinsAfter,
    item: result.item,
  };
}

export async function equipItem(userId: string, storeItemId: string, equip: boolean) {
  const student = await getStudentByUserIdOrThrow(userId);

  const owned = await prisma.studentStoreItem.findUnique({
    where: {
      studentId_storeItemId: {
        studentId: student.id,
        storeItemId,
      },
    },
    include: { storeItem: true },
  });

  if (!owned) {
    throw { status: 403, message: 'Item not owned' };
  }

  const itemType = owned.storeItem.type;
  const equippedField =
    itemType === StoreItemType.AVATAR_FRAME
      ? 'equippedAvatarFrameId'
      : 'equippedNicknameId';

  await prisma.$transaction(async (tx) => {
    if (equip) {
      // Unequip all same-type items first
      await tx.studentStoreItem.updateMany({
        where: {
          studentId: student.id,
          storeItem: { type: itemType },
        },
        data: { isEquipped: false },
      });

      await tx.studentStoreItem.update({
        where: {
          studentId_storeItemId: {
            studentId: student.id,
            storeItemId,
          },
        },
        data: { isEquipped: true },
      });

      await tx.student.update({
        where: { id: student.id },
        data: { [equippedField]: storeItemId },
      });
    } else {
      await tx.studentStoreItem.update({
        where: {
          studentId_storeItemId: {
            studentId: student.id,
            storeItemId,
          },
        },
        data: { isEquipped: false },
      });

      await tx.student.update({
        where: { id: student.id },
        data: { [equippedField]: null },
      });
    }
  });

  const updatedStudent = await prisma.student.findUnique({
    where: { id: student.id },
    select: {
      equippedAvatarFrame: true,
      equippedNickname: true,
    },
  });

  return {
    success: true,
    equippedAvatarFrame: updatedStudent?.equippedAvatarFrame ?? null,
    equippedNickname: updatedStudent?.equippedNickname ?? null,
  };
}

export async function createStoreItem(data: CreateStoreItemInput, createdById?: string) {
  return prisma.storeItem.create({
    data: {
      type: data.type,
      rarity: data.rarity ?? StoreItemRarity.COMMON,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      coinCost: data.coinCost,
      nameEn: data.nameEn.trim(),
      nameHe: data.nameHe.trim(),
      nameAr: data.nameAr.trim(),
      descEn: data.descEn ?? null,
      descHe: data.descHe ?? null,
      descAr: data.descAr ?? null,
      frameImageUrl: data.frameImageUrl ?? null,
      frameAnimated: data.frameAnimated ?? false,
      frameCssClass: data.frameCssClass ?? null,
      frameBorderColor: data.frameBorderColor ?? null,
      frameBorderRadius: data.frameBorderRadius ?? null,
      nicknameColor: data.nicknameColor ?? null,
      nicknameGlow: data.nicknameGlow ?? false,
      nicknameGlowColor: data.nicknameGlowColor ?? null,
      nicknameFont: data.nicknameFont ?? null,
      nicknameBadgeIcon: data.nicknameBadgeIcon ?? null,
      nicknameCssClass: data.nicknameCssClass ?? null,
      createdById: createdById ?? null,
    },
  });
}

export async function updateStoreItem(id: string, data: UpdateStoreItemInput) {
  const existing = await prisma.storeItem.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Store item not found' };
  }

  return prisma.storeItem.update({
    where: { id },
    data: {
      ...data,
      nameEn: data.nameEn !== undefined ? data.nameEn.trim() : undefined,
      nameHe: data.nameHe !== undefined ? data.nameHe.trim() : undefined,
      nameAr: data.nameAr !== undefined ? data.nameAr.trim() : undefined,
    },
  });
}

export async function deleteStoreItem(id: string) {
  const existing = await prisma.storeItem.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Store item not found' };
  }

  const item = await prisma.storeItem.update({
    where: { id },
    data: { isActive: false },
  });

  return { success: true, item };
}

export async function grantCoins(
  studentId: string,
  amount: number,
  reason: string
) {
  if (!amount || amount === 0 || !Number.isInteger(amount)) {
    throw { status: 400, message: 'Amount must be a non-zero integer' };
  }
  if (!reason || !reason.trim()) {
    throw { status: 400, message: 'Reason is required' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true, coins: true },
    });

    if (!student) {
      throw { status: 404, message: 'Student not found' };
    }

    const coinsAfter = student.coins + amount;
    if (coinsAfter < 0) {
      throw {
        status: 400,
        message: `Cannot deduct ${Math.abs(amount)} coins: student only has ${student.coins} coins`,
      };
    }

    await tx.student.update({
      where: { id: student.id },
      data: { coins: coinsAfter },
    });

    const txType =
      amount > 0 ? CoinTransactionType.ADMIN_GRANT : CoinTransactionType.ADMIN_DEDUCT;

    const transaction = await tx.coinTransaction.create({
      data: {
        studentId: student.id,
        amount,
        coinsAfter,
        type: txType,
        description: reason.trim(),
      },
      include: {
        storeItem: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      coinsAfter,
      transaction,
      studentUserId: student.userId,
    };
  });

  if (amount > 0) {
    notificationService
      .createNotification({
        userId: result.studentUserId,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.NORMAL,
        type: 'ADMIN_COIN_GRANT',
        titleEn: `💰 You received ${amount} coins!`,
        titleHe: `💰 קיבלת ${amount} מטבעות!`,
        bodyEn: `You received ${amount} coins from an admin. Reason: ${reason.trim()}`,
        bodyHe: `קיבלת ${amount} מטבעות ממנהל המערכת. סיבה: ${reason.trim()}`,
        actionUrl: '/student?tab=store',
        metaJson: { amount, coinsAfter: result.coinsAfter },
      })
      .catch((err) => console.error('[Store.grantCoins notification error]', err));
  }

  return {
    success: result.success,
    coinsAfter: result.coinsAfter,
    transaction: result.transaction,
  };
}

export async function listTransactions(filters: TransactionFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.CoinTransactionWhereInput = {};

  if (filters.studentId) {
    where.studentId = filters.studentId;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      {
        student: {
          user: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.coinTransaction.findMany({
      where,
      include: {
        storeItem: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.coinTransaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getStudentTransactions(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });
  if (!student) {
    throw { status: 404, message: 'Student not found' };
  }

  return prisma.coinTransaction.findMany({
    where: { studentId },
    include: {
      storeItem: true,
      student: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
