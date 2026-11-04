import { Router } from 'express';
import {
  listGamesHandler,
  getLeaderboardHandler,
  getGameHandler,
  createGameHandler,
  updateGameHandler,
  deleteGameHandler,
  recordGameSessionHandler,
} from './games.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', listGamesHandler);
router.get('/leaderboard', getLeaderboardHandler);
router.get('/:id', getGameHandler);
router.post('/', requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), createGameHandler);
router.put('/:id', requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), updateGameHandler);
router.patch('/:id', requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), updateGameHandler);
router.delete('/:id', requireRoles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), deleteGameHandler);
router.post('/:id/play', recordGameSessionHandler);

export default router;

