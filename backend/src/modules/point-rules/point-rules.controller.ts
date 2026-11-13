import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './point-rules.service';

export async function listRules(req: AuthRequest, res: Response) {
  const items = await service.listPointRules();
  res.json(items);
}

export async function updateRule(req: AuthRequest, res: Response) {
  const updated = await service.updatePointRule(
    req.params.id,
    req.body,
    req.user?.userId
  );
  res.json(updated);
}
