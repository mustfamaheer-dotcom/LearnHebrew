import { prisma } from '../../config/database';
import { Prisma, HebrewLevel, GameType, PointsEventType } from '@prisma/client';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';
import { awardCoinsForPoints } from '../store/store.service';

export async function listGames(filters: {
  level?: HebrewLevel;
  gameType?: GameType;
  lessonId?: string;
  createdById?: string;
}) {
  const cacheKey = `games:list:${filters.level || 'all'}:${filters.gameType || 'all'}:${filters.lessonId || 'all'}:${filters.createdById || 'all'}`;

  return getCachedOrFetch(cacheKey, 60, async () => {
    const where: any = { isActive: true };
    if (filters.level) {
      where.OR = [
        { level: filters.level as any },
        { levelModel: { code: String(filters.level) } },
        { levelId: String(filters.level) },
      ];
    }
    if (filters.gameType) where.gameType = filters.gameType;
    if (filters.lessonId) where.lessonId = filters.lessonId;
    if (filters.createdById) where.createdById = filters.createdById;

    return prisma.game.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        levelModel: true,
        lesson: {
          select: {
            id: true,
            scheduledAt: true,
            durationMinutes: true,
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  });
}

export async function getLeaderboard(
  period: 'all_time' | 'weekly' | 'monthly' = 'all_time',
  level?: string
) {
  const validHebrewLevels = Object.values(HebrewLevel) as string[];
  const normalizedLevel = level ? level.trim().toUpperCase() : undefined;
  const isEnumLevel = normalizedLevel ? validHebrewLevels.includes(normalizedLevel) : false;

  const levelCondition: Prisma.StudentWhereInput | null =
    normalizedLevel && normalizedLevel !== 'ALL'
      ? isEnumLevel
        ? {
            OR: [
              { level: normalizedLevel as HebrewLevel },
              { levelModel: { code: normalizedLevel } },
              { levelId: level },
            ],
          }
        : {
            OR: [
              { levelModel: { code: level } },
              { levelId: level },
            ],
          }
      : null;

  if (period === 'weekly' || period === 'monthly') {
    const days = period === 'weekly' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let eligibleStudentIds: string[] | undefined = undefined;
    if (levelCondition) {
      const eligibleStudents = await prisma.student.findMany({
        where: levelCondition,
        select: { id: true },
      });
      eligibleStudentIds = eligibleStudents.map((s) => s.id);
      if (eligibleStudentIds.length === 0) {
        return [];
      }
    }

    const whereLedger: Prisma.PointsLedgerWhereInput = {
      createdAt: { gte: since },
      ...(eligibleStudentIds ? { studentId: { in: eligibleStudentIds } } : {}),
    };

    const grouped = await prisma.pointsLedger.groupBy({
      by: ['studentId'],
      _sum: { points: true },
      where: whereLedger,
      orderBy: { _sum: { points: 'desc' } },
      take: 50,
    });

    const studentInclude: Prisma.StudentInclude = {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      levelModel: { select: { code: true, labelEn: true, labelHe: true } },
      badges: { orderBy: { awardedAt: 'desc' }, take: 3 },
      equippedAvatarFrame: true,
      equippedNickname: true,
    };

    const studentIds = grouped.map((g) => g.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: studentInclude,
    });

    const studentMap = new Map(students.map((s) => [s.id, s]));

    const results = grouped
      .map((g, idx) => {
        const student = studentMap.get(g.studentId);
        if (!student) return null;
        return {
          rank: idx + 1,
          studentId: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          avatarUrl: student.user.avatarUrl,
          level: student.levelModel?.code || student.level,
          levelLabelEn: student.levelModel?.labelEn,
          levelLabelHe: student.levelModel?.labelHe,
          totalPoints: g._sum.points || 0,
          lifetimePoints: student.totalPoints,
          streakDays: student.streakDays,
          badges: student.badges,
          equippedAvatarFrame: student.equippedAvatarFrame,
          equippedNickname: student.equippedNickname,
        };
      })
      .filter(Boolean);

    // If new week has records, return them
    if (results.length > 0) return results;
  }

  // All-time leaderboard (or fallback when period has no records)
  const topStudents = await prisma.student.findMany({
    where: levelCondition || {},
    take: 50,
    orderBy: { totalPoints: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      levelModel: {
        select: {
          code: true,
          labelEn: true,
          labelHe: true,
        },
      },
      badges: {
        orderBy: { awardedAt: 'desc' },
        take: 3,
      },
      equippedAvatarFrame: true,
      equippedNickname: true,
    } satisfies Prisma.StudentInclude,
  });

  return topStudents.map((s, idx) => ({
    rank: idx + 1,
    studentId: s.id,
    name: `${s.user.firstName} ${s.user.lastName}`,
    avatarUrl: s.user.avatarUrl,
    level: s.levelModel?.code || s.level,
    levelLabelEn: s.levelModel?.labelEn,
    levelLabelHe: s.levelModel?.labelHe,
    totalPoints: s.totalPoints,
    lifetimePoints: s.totalPoints,
    streakDays: s.streakDays,
    badges: s.badges,
    equippedAvatarFrame: s.equippedAvatarFrame,
    equippedNickname: s.equippedNickname,
  }));
}

export async function resetLeaderboardSeason(
  seasonKey: string,
  seasonTitle: string,
  seasonTitleHe?: string
) {
  const topWeekly = await getLeaderboard('all_time');
  const top3 = topWeekly.slice(0, 3);

  const awards = [
    { rank: 1, icon: 'trophy', title: `Champion of ${seasonTitle}`, titleHe: `אלוף ${seasonTitleHe || seasonTitle}` },
    { rank: 2, icon: 'medal', title: `Silver Finalist - ${seasonTitle}`, titleHe: `סגן אלוף - ${seasonTitleHe || seasonTitle}` },
    { rank: 3, icon: 'award', title: `Bronze Finalist - ${seasonTitle}`, titleHe: `מקום שלישי - ${seasonTitleHe || seasonTitle}` },
  ];

  const createdBadges = [];
  for (let i = 0; i < top3.length; i++) {
    const studentEntry = top3[i] as any;
    const award = awards[i];
    const badge = await prisma.badge.create({
      data: {
        studentId: studentEntry.studentId,
        code: `SEASON_${seasonKey.toUpperCase()}_R${award.rank}`,
        title: award.title,
        titleHe: award.titleHe,
        description: `Achieved Rank #${award.rank} in ${seasonTitle}`,
        descriptionHe: `זכה במקום #${award.rank} בליגת ${seasonTitleHe || seasonTitle}`,
        icon: award.icon,
        seasonKey,
        rankAwarded: award.rank,
      },
    });
    createdBadges.push(badge);
  }

  return createdBadges;
}

export async function getGameById(id: string) {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      lesson: {
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          student: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });
  if (!game) throw { status: 404, message: 'Game not found' };
  return game;
}

export async function createGame(data: any) {
  const game = await prisma.game.create({
    data,
    include: {
      lesson: {
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          student: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
  await cacheInvalidatePrefix('games:');
  return game;
}

export async function updateGame(id: string, data: any) {
  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Game not found' };

  const game = await prisma.game.update({
    where: { id },
    data,
    include: {
      lesson: {
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          student: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
  await cacheInvalidatePrefix('games:');
  return game;
}

export async function deleteGame(id: string) {
  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Game not found' };

  const deleted = await prisma.game.delete({ where: { id } });
  await cacheInvalidatePrefix('games:');
  return deleted;
}

export async function recordGameSession(
  gameId: string,
  userId: string,
  score: number,
  completed: boolean
) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw { status: 403, message: 'Only students can play games' };

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw { status: 404, message: 'Game not found' };

  // Score clamping between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Passing threshold: student must complete the game and achieve at least 50%
  const isPassing = completed && normalizedScore >= 50;

  // Potential points for this attempt:
  // Proportional base points (e.g. 80% score of a 20-pt game = 16 pts)
  // Perfect score bonus: +25 pts when scoring 100%
  let potentialPoints = 0;
  if (isPassing) {
    const baseReward = Math.round(game.pointsReward * (normalizedScore / 100));
    const perfectBonus = normalizedScore === 100 ? 25 : 0;
    potentialPoints = baseReward + perfectBonus;
  }

  // Anti-Farming & Replay Protection:
  // Fetch all previous completed sessions for this game by this student
  const previousSessions = await prisma.studentGameSession.findMany({
    where: {
      studentId: student.id,
      gameId: game.id,
      completed: true,
    },
    select: { pointsEarned: true, score: true },
  });

  // Calculate total points this student has already earned for this game
  const totalPointsAlreadyEarned = previousSessions.reduce(
    (sum, s) => sum + Math.max(0, s.pointsEarned),
    0
  );

  const previousBestScore = previousSessions.length > 0
    ? Math.max(...previousSessions.map((s) => s.score))
    : 0;

  // Student can ONLY earn points if potentialPoints exceeds what they already claimed for this game
  const pointsToAward = Math.max(0, potentialPoints - totalPointsAlreadyEarned);

  return prisma.$transaction(async (tx) => {
    const session = await tx.studentGameSession.create({
      data: {
        studentId: student.id,
        gameId: game.id,
        score: normalizedScore,
        pointsEarned: pointsToAward,
        completed,
      },
    });

    // Mark any active unplayed unlock as consumed
    await tx.studentGameUnlock.updateMany({
      where: {
        studentId: student.id,
        gameId: game.id,
        isPlayed: false,
      },
      data: {
        isPlayed: true,
      },
    });

    // Only update student balance and points ledger if new points were awarded
    if (pointsToAward > 0) {
      const updatedStudent = await tx.student.update({
        where: { id: student.id },
        data: { totalPoints: { increment: pointsToAward } },
        select: { totalPoints: true },
      });

      const newPoints = updatedStudent.totalPoints;
      const previousPoints = newPoints - pointsToAward;
      await awardCoinsForPoints(student.id, previousPoints, newPoints, tx);

      await tx.pointsLedger.create({
        data: {
          studentId: student.id,
          eventType: PointsEventType.GAME_PLAYED,
          points: pointsToAward,
          referenceId: session.id,
          description: `Played game: ${game.title} (Score: ${normalizedScore}%${
            totalPointsAlreadyEarned > 0 ? `, +${pointsToAward} pts delta` : ''
          })`,
        },
      });
    }

    return {
      session,
      pointsEarned: pointsToAward,
      potentialPoints,
      totalPointsAlreadyEarned,
      previousBestScore,
      isPerfect: normalizedScore === 100,
      isPassing,
      alreadyMaxed: pointsToAward === 0 && isPassing,
    };
  });
}


/**
 * Teachers unlock games for a student after a session.
 * Student can play 1 time; then locked until next session unlock.
 */
export async function unlockGameForStudent(params: {
  gameId: string;
  studentId: string;
  lessonId: string;
  teacherUserId: string;
}) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: params.studentId }, { userId: params.studentId }] },
    include: { user: true },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const game = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!game) throw { status: 404, message: 'Game not found' };

  const unlock = await prisma.studentGameUnlock.upsert({
    where: {
      studentId_gameId_lessonId: {
        studentId: student.id,
        gameId: game.id,
        lessonId: params.lessonId,
      },
    },
    update: {
      isPlayed: false,
      unlockedAt: new Date(),
    },
    create: {
      studentId: student.id,
      gameId: game.id,
      lessonId: params.lessonId,
      unlockedById: params.teacherUserId,
      isPlayed: false,
    },
    include: { game: true },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: student.userId,
      type: 'GAME_UNLOCKED',
      title: `Practice Game Unlocked: ${game.title} 🎮`,
      titleEn: `Practice Game Unlocked: ${game.title} 🎮`,
      titleHe: `נפתח משחק תרגול: ${game.titleHe} 🎮`,
      body: 'Your teacher unlocked a custom game for you following your lesson. Complete it to earn points!',
      bodyEn: 'Your teacher unlocked a custom game for you following your lesson. Complete it to earn points!',
      bodyHe: 'המורה פתח עבורך משחק תרגול בעקבות השיעור. שחק עכשיו וצבור נקודות!',
    },
  });

  return unlock;
}

export async function checkGameAccess(gameId: string, studentUserId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) return { canPlay: false, reason: 'Only students can play' };

  // Check if an active unplayed unlock exists for this game
  const activeUnlock = await prisma.studentGameUnlock.findFirst({
    where: {
      studentId: student.id,
      gameId,
      isPlayed: false,
    },
    orderBy: { unlockedAt: 'desc' },
  });

  if (!activeUnlock) {
    return {
      canPlay: false,
      reason: 'LOCKED: This game is locked. Your teacher can unlock it for you after your private session.',
    };
  }

  return { canPlay: true, unlockId: activeUnlock.id };
}
