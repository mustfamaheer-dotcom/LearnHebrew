import { Request, Response } from 'express';
import * as service from './session-types.service';

export async function listSessionTypes(req: Request, res: Response) {
  const items = await service.listSessionTypes();
  res.json(items);
}

export async function createSessionType(req: Request, res: Response) {
  const item = await service.createSessionType(req.body);
  res.status(201).json(item);
}

export async function updateSessionType(req: Request, res: Response) {
  const item = await service.updateSessionType(req.params.id, req.body);
  res.json(item);
}

export async function deleteSessionType(req: Request, res: Response) {
  await service.deleteSessionType(req.params.id);
  res.json({ message: 'Session type removed successfully' });
}
