import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './review-links.service';

export async function listLinks(req: AuthRequest, res: Response) {
  const items = await service.listReviewLinks();
  res.json(items);
}

export async function createLink(req: AuthRequest, res: Response) {
  const item = await service.createReviewLink({
    targetUrl: req.body.targetUrl,
    label: req.body.label,
    createdById: req.user!.userId,
  });
  res.status(201).json(item);
}

export async function redeemLink(req: Request, res: Response) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
  const result = await service.redeemReviewLink(req.params.token, ip);
  res.json(result);
}

export async function deleteLink(req: AuthRequest, res: Response) {
  await service.deleteReviewLink(req.params.id);
  res.json({ message: 'Review link removed successfully' });
}
