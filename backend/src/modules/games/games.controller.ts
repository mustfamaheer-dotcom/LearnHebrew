import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as gamesService from './games.service';
import { AuthRequest } from '../../middleware/auth';
import { HebrewLevel, GameType } from '@prisma/client';

const createGameSchema = z.object({
  title: z.string().min(1),
  titleHe: z.string().min(1),
  description: z.string().optional(),
  gameType: z.nativeEnum(GameType),
  level: z.nativeEnum(HebrewLevel),
  lessonId: z.string().uuid().optional().nullable(),
  configJson: z.any(),
  pointsReward: z.number().int().default(20),
});

const updateGameSchema = z.object({
  title: z.string().min(1).optional(),
  titleHe: z.string().min(1).optional(),
  description: z.string().optional(),
  gameType: z.nativeEnum(GameType).optional(),
  level: z.nativeEnum(HebrewLevel).optional(),
  lessonId: z.string().uuid().optional().nullable(),
  configJson: z.any().optional(),
  pointsReward: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const playSessionSchema = z.object({
  score: z.number().int().min(0).max(100),
  completed: z.boolean().default(true),
});

export async function listGamesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const level = req.query.level as HebrewLevel | undefined;
    const gameType = req.query.gameType as GameType | undefined;
    const lessonId = req.query.lessonId as string | undefined;
    const createdById = req.query.createdById as string | undefined;
    const games = await gamesService.listGames({ level, gameType, lessonId, createdById });
    res.json({ games });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboardHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as any) || 'all_time';
    const leaderboard = await gamesService.getLeaderboard(period);
    res.json({ leaderboard, period });
  } catch (error) {
    next(error);
  }
}

export async function resetSeasonHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { seasonKey, seasonTitle, seasonTitleHe } = req.body;
    const badges = await gamesService.resetLeaderboardSeason(
      seasonKey || `SEASON_${new Date().toISOString().slice(0, 7)}`,
      seasonTitle || 'Hebrew Monthly League',
      seasonTitleHe || 'ליגת העברית החודשית'
    );
    res.json({ message: 'Season finalized and badges awarded successfully', badges });
  } catch (error) {
    next(error);
  }
}

export async function getGameHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const game = await gamesService.getGameById(req.params.id);
    res.json({ game });
  } catch (error) {
    next(error);
  }
}

export async function createGameHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createGameSchema.parse(req.body);
    const game = await gamesService.createGame({
      ...data,
      createdById: req.user!.userId,
    });
    res.status(201).json({ game });
  } catch (error) {
    next(error);
  }
}

export async function updateGameHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateGameSchema.parse(req.body);
    const game = await gamesService.updateGame(req.params.id, data);
    res.json({ game });
  } catch (error) {
    next(error);
  }
}

export async function deleteGameHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await gamesService.deleteGame(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function recordGameSessionHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = playSessionSchema.parse(req.body);
    const result = await gamesService.recordGameSession(
      req.params.id,
      req.user!.userId,
      data.score,
      data.completed
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

