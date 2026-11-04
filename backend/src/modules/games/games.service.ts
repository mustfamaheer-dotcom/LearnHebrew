import { prisma } from '../../config/database';
import { HebrewLevel, GameType, PointsEventType } from '@prisma/client';

export async function listGames(filters: {
  level?: HebrewLevel;
  gameType?: GameType;
  lessonId?: string;
  createdById?: string;
}) {
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
}

export async function getLeaderboard() {
  const topStudents = await prisma.student.findMany({
    take: 10,
    orderBy: { totalPoints: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return topStudents.map((s, idx) => ({
    rank: idx + 1,
    studentId: s.id,
    name: `${s.user.firstName} ${s.user.lastName}`,
    avatarUrl: s.user.avatarUrl,
    level: s.level,
    totalPoints: s.totalPoints,
    streakDays: s.streakDays,
  }));
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
  return prisma.game.create({
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
}

export async function updateGame(id: string, data: any) {
  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Game not found' };

  return prisma.game.update({
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
}

export async function deleteGame(id: string) {
  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Game not found' };

  return prisma.game.delete({ where: { id } });
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

