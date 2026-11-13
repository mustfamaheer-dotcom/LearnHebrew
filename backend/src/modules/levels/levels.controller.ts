import { Request, Response } from 'express';
import * as levelsService from './levels.service';

export async function listLevels(req: Request, res: Response) {
  const levels = await levelsService.listLevels();
  res.json(levels);
}

export async function createLevel(req: Request, res: Response) {
  const level = await levelsService.createLevel(req.body);
  res.status(201).json(level);
}

export async function updateLevel(req: Request, res: Response) {
  const level = await levelsService.updateLevel(req.params.id, req.body);
  res.json(level);
}

export async function deleteLevel(req: Request, res: Response) {
  await levelsService.deleteLevel(req.params.id);
  res.json({ message: 'Level deleted successfully' });
}
