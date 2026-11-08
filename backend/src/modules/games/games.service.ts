import { prisma } from '../../config/database';
import { Prisma, HebrewLevel, GameType, PointsEventType } from '@prisma/client';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listGames(filters: {
  level?: HebrewLevel;
  gameType?: GameType;
  lessonId?: string;
  createdById?: string;
}) {
  const cacheKey = `games:list:${filters.level || 'all'}:${filters.gameType || 'all'}:${filters.lessonId || 'all'}:${filters.createdById || 'all'}`;

  return getCachedOrFetch(cacheKey, 60, async () => {
    const where: any = { isActive: true };
    if (filters.level) where.level = filters.level;
    if (filters.gameType) where.gameType = filters.gameType;
    if (filters.lessonId) where.lessonId = filters.lessonId;
    if (filters.createdById) where.createdById = filters.createdById;

    return prisma.game.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
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

export async function getLeaderboard(period: 'all_time' | 'weekly' | 'monthly' = 'all_time') {
  if (period === 'weekly' || period === 'monthly') {
    const days = period === 'weekly' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await prisma.pointsLedger.groupBy({
      by: ['studentId'],
      _sum: { points: true },
      where: { createdAt: { gte: since } },
      orderBy: { _sum: { points: 'desc' } },
      take: 10,
    });

    const studentInclude: Prisma.StudentInclude = {
      user: { select: { firstName: true, lastName: true } },
      badges: { orderBy: { awardedAt: 'desc' }, take: 3 },
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
          level: student.level,
          totalPoints: g._sum.points || 0,
          lifetimePoints: student.totalPoints,
          streakDays: student.streakDays,
          badges: student.badges,
        };
      })
      .filter(Boolean);

    // If new week has few records, fallback to all-time
    if (results.length > 0) return results;
  }

  // All-time leaderboard
  const topStudents = await prisma.student.findMany({
    take: 10,
    orderBy: { totalPoints: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      badges: {
        orderBy: { awardedAt: 'desc' },
        take: 3,
      },
    } satisfies Prisma.StudentInclude,
  });

  return topStudents.map((s, idx) => ({
    rank: idx + 1,
    studentId: s.id,
    name: `${s.user.firstName} ${s.user.lastName}`,
    level: s.level,
    totalPoints: s.totalPoints,
    lifetimePoints: s.totalPoints,
    streakDays: s.streakDays,
    badges: s.badges,
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
    { rank: 1, icon: '🥇', title: `Champion of ${seasonTitle}`, titleHe: `אלוף ${seasonTitleHe || seasonTitle}` },
    { rank: 2, icon: '🥈', title: `Silver Finalist - ${seasonTitle}`, titleHe: `סגן אלוף - ${seasonTitleHe || seasonTitle}` },
    { rank: 3, icon: '🥉', title: `Bronze Finalist - ${seasonTitle}`, titleHe: `מקום שלישי - ${seasonTitleHe || seasonTitle}` },
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

  // Calculate points: base reward + perfect score bonus (+25 if score == 100)
  let points = game.pointsReward;
  if (score === 100) {
    points += 25; // Perfect game score bonus
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.studentGameSession.create({
      data: {
        studentId: student.id,
        gameId: game.id,
        score,
        pointsEarned: points,
        completed,
      },
    });

    await tx.student.update({
      where: { id: student.id },
      data: { totalPoints: { increment: points } },
    });

    await tx.pointsLedger.create({
      data: {
        studentId: student.id,
        eventType: PointsEventType.GAME_PLAYED,
        points,
        referenceId: session.id,
        description: `Played game: ${game.title} (Score: ${score}%)`,
      },
    });

    return {
      session,
      pointsEarned: points,
      isPerfect: score === 100,
    };
  });
}

