import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { CoinTransactionType, StoreItemRarity, StoreItemType } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import * as storeService from './store.service';

const createItemSchema = z.object({
  type: z.nativeEnum(StoreItemType),
  rarity: z.nativeEnum(StoreItemRarity).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  coinCost: z.number().int().min(1),
  nameEn: z.string().min(1),
  nameHe: z.string().min(1),
  nameAr: z.string().min(1),
  descEn: z.string().nullable().optional(),
  descHe: z.string().nullable().optional(),
  descAr: z.string().nullable().optional(),
  frameImageUrl: z.string().nullable().optional(),
  frameAnimated: z.boolean().optional(),
  frameCssClass: z.string().nullable().optional(),
  frameBorderColor: z.string().nullable().optional(),
  frameBorderRadius: z.string().nullable().optional(),
  nicknameColor: z.string().nullable().optional(),
  nicknameGlow: z.boolean().optional(),
  nicknameGlowColor: z.string().nullable().optional(),
  nicknameFont: z.string().nullable().optional(),
  nicknameBadgeIcon: z.string().nullable().optional(),
  nicknameCssClass: z.string().nullable().optional(),
});

const updateItemSchema = createItemSchema.partial();

const redeemSchema = z.object({
  storeItemId: z.string().uuid(),
});

const equipSchema = z.object({
  storeItemId: z.string().uuid(),
  equip: z.boolean(),
});

const grantCoinsSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, {
    message: 'Amount must be non-zero',
  }),
  reason: z.string().trim().min(1, 'Reason is required'),
});

export async function listItems(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, rarity, maxCost, activeOnly } = req.query;

    const parsedType =
      typeof type === 'string' && Object.values(StoreItemType).includes(type as StoreItemType)
        ? (type as StoreItemType)
        : undefined;

    const parsedRarity =
      typeof rarity === 'string' && Object.values(StoreItemRarity).includes(rarity as StoreItemRarity)
        ? (rarity as StoreItemRarity)
        : undefined;

    const parsedMaxCost =
      typeof maxCost === 'string' && maxCost !== '' ? Number(maxCost) : undefined;

    const parsedActiveOnly =
      activeOnly === 'false' ? false : true;

    const items = await storeService.listStoreItems({
      type: parsedType,
      rarity: parsedRarity,
      maxCost: parsedMaxCost,
      activeOnly: parsedActiveOnly,
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const item = await storeService.getStoreItemById(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function getMyCoins(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await storeService.getMyCoins(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyInventory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await storeService.getMyInventory(req.user!.userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function redeemItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = redeemSchema.parse(req.body);
    const result = await storeService.redeemItem(req.user!.userId, body.storeItemId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function equipItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = equipSchema.parse(req.body);
    const result = await storeService.equipItem(req.user!.userId, body.storeItemId, body.equip);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = createItemSchema.parse(req.body);
    const item = await storeService.createStoreItem(body, req.user?.userId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = updateItemSchema.parse(req.body);
    const item = await storeService.updateStoreItem(req.params.id, body);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await storeService.deleteStoreItem(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function grantCoins(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = grantCoinsSchema.parse(req.body);
    const result = await storeService.grantCoins(body.studentId, body.amount, body.reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, studentId, type, search, startDate, endDate } = req.query;

    const parsedType =
      typeof type === 'string' &&
      Object.values(CoinTransactionType).includes(type as CoinTransactionType)
        ? (type as CoinTransactionType)
        : undefined;

    const result = await storeService.listTransactions({
      page: typeof page === 'string' ? Number(page) : undefined,
      limit: typeof limit === 'string' ? Number(limit) : undefined,
      studentId: typeof studentId === 'string' && studentId ? studentId : undefined,
      type: parsedType,
      search: typeof search === 'string' ? search : undefined,
      startDate: typeof startDate === 'string' && startDate ? startDate : undefined,
      endDate: typeof endDate === 'string' && endDate ? endDate : undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const transactions = await storeService.getStudentTransactions(req.params.studentId);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}
