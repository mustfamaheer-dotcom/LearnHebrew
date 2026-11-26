import { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './shorts.service';
import { AuthRequest } from '../../middleware/auth';

const createShortSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleHe: z.string().optional(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionHe: z.string().optional(),
  descriptionAr: z.string().optional(),
  videoUrl: z.string().min(1, 'Video URL is required'),
  thumbnailUrl: z.string().optional(),
  levelId: z.string().optional(),
  levelCode: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateShortSchema = createShortSchema.partial();

export async function listShorts(req: AuthRequest, res: Response) {
  try {
    const levelCode = req.query.levelCode as string | undefined;
    const userId = req.user?.userId;
    const shorts = await service.listActiveShorts({ levelCode, userId });
    return res.json({ success: true, shorts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to list practice shorts' });
  }
}

export async function listAdminShorts(req: Request, res: Response) {
  try {
    const shorts = await service.listAdminShorts();
    return res.json({ success: true, shorts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin shorts' });
  }
}

export async function createShort(req: AuthRequest, res: Response) {
  try {
    const validated = createShortSchema.parse(req.body);
    const short = await service.createShort({
      ...validated,
      createdById: req.user?.userId,
    });
    return res.status(201).json({ success: true, short });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: error.message || 'Failed to create short' });
  }
}

export async function updateShort(req: Request, res: Response) {
  try {
    const validated = updateShortSchema.parse(req.body);
    const short = await service.updateShort(req.params.id, validated);
    return res.json({ success: true, short });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: error.message || 'Failed to update short' });
  }
}

export async function deleteShort(req: Request, res: Response) {
  try {
    await service.deleteShort(req.params.id);
    return res.json({ success: true, message: 'Short deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete short' });
  }
}

export async function reorderShorts(req: Request, res: Response) {
  try {
    const items = req.body.items as { id: string; sortOrder: number }[];
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    await service.reorderShorts(items);
    return res.json({ success: true, message: 'Shorts reordered successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to reorder shorts' });
  }
}

export async function interactWithShort(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { isLiked, isSaved, watchedSeconds } = req.body;
    const interaction = await service.interactWithShort(req.params.id, userId, {
      isLiked,
      isSaved,
      watchedSeconds,
    });
    return res.json({ success: true, interaction });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to record interaction' });
  }
}

export async function trackView(req: Request, res: Response) {
  try {
    await service.incrementViewCount(req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to track view' });
  }
}
