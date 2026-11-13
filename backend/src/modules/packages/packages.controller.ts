import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as packagesService from './packages.service';
import { AuthRequest } from '../../middleware/auth';

const createPackageSchema = z
  .object({
    name: z.string().optional(),
    nameEn: z.string().optional(),
    nameHe: z.string().optional(),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionHe: z.string().optional(),
    totalLessons: z.number().int().optional(),
    lessonsCount: z.number().int().optional(),
    validityDays: z.number().int().positive().optional().default(30),
    durationDays: z.number().int().positive().optional(),
    price: z.number().min(0).optional(),
    priceUsd: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional().nullable(),
    onSale: z.boolean().optional(),
    currency: z.enum(['USD', 'ILS']).default('USD'),
    sessionItems: z
      .array(
        z.object({
          sessionTypeId: z.string(),
          quantity: z.number().int().nonnegative(),
        })
      )
      .optional(),
  })
  .transform((val) => ({
    name: (val.name || val.nameEn || 'Package').trim(),
    nameHe: (val.nameHe || val.name || val.nameEn || 'חבילת שיעורים').trim(),
    description: val.description || val.descriptionEn,
    descriptionHe: val.descriptionHe,
    totalLessons: val.totalLessons ?? val.lessonsCount ?? 0,
    validityDays: val.validityDays ?? val.durationDays ?? 30,
    price: val.price ?? val.priceUsd ?? 0,
    originalPrice: val.originalPrice ?? null,
    onSale: val.onSale ?? false,
    currency: val.currency || 'USD',
    sessionItems: (val.sessionItems || []).filter((item) => item.quantity > 0),
  }));

const updatePackageSchema = z
  .object({
    name: z.string().optional(),
    nameEn: z.string().optional(),
    nameHe: z.string().optional(),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionHe: z.string().optional(),
    totalLessons: z.number().int().optional(),
    lessonsCount: z.number().int().optional(),
    validityDays: z.number().int().positive().optional(),
    durationDays: z.number().int().positive().optional(),
    price: z.number().min(0).optional(),
    priceUsd: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional().nullable(),
    onSale: z.boolean().optional(),
    currency: z.enum(['USD', 'ILS']).optional(),
    isActive: z.boolean().optional(),
    sessionItems: z
      .array(
        z.object({
          sessionTypeId: z.string(),
          quantity: z.number().int().nonnegative(),
        })
      )
      .optional(),
  })
  .transform((val) => ({
    ...(val.name || val.nameEn ? { name: (val.name || val.nameEn)!.trim() } : {}),
    ...(val.nameHe ? { nameHe: val.nameHe.trim() } : {}),
    ...(val.description !== undefined || val.descriptionEn !== undefined
      ? { description: val.description || val.descriptionEn }
      : {}),
    ...(val.descriptionHe !== undefined ? { descriptionHe: val.descriptionHe } : {}),
    ...(val.totalLessons !== undefined || val.lessonsCount !== undefined
      ? { totalLessons: val.totalLessons ?? val.lessonsCount }
      : {}),
    ...(val.validityDays !== undefined || val.durationDays !== undefined
      ? { validityDays: val.validityDays ?? val.durationDays }
      : {}),
    ...(val.price !== undefined || val.priceUsd !== undefined
      ? { price: val.price ?? val.priceUsd }
      : {}),
    ...(val.originalPrice !== undefined ? { originalPrice: val.originalPrice } : {}),
    ...(val.onSale !== undefined ? { onSale: val.onSale } : {}),
    ...(val.currency ? { currency: val.currency } : {}),
    ...(val.isActive !== undefined ? { isActive: val.isActive } : {}),
    ...(val.sessionItems
      ? { sessionItems: val.sessionItems.filter((i) => i.quantity > 0) }
      : {}),
  }));

const assignPackageSchema = z.object({
  studentId: z.string(),
  startDate: z.string().optional(),
  customCredits: z.number().int().positive().optional(),
});

const grantCreditsSchema = z.object({
  studentId: z.string(),
  credits: z.number().int().positive(),
  reason: z.string().optional(),
});

export async function listPackagesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const packages = await packagesService.listPackages();
    res.json({ packages });
  } catch (error) {
    next(error);
  }
}

export async function createPackageHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createPackageSchema.parse(req.body);
    const pkg = await packagesService.createPackage(data);
    res.status(201).json({ package: pkg });
  } catch (error) {
    next(error);
  }
}

export async function updatePackageHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updatePackageSchema.parse(req.body);
    const pkg = await packagesService.updatePackage(req.params.id, data);
    res.json({ package: pkg });
  } catch (error) {
    next(error);
  }
}

export async function deletePackageHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await packagesService.deletePackage(req.params.id);
    res.json({ message: 'Package deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function assignPackageHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = assignPackageSchema.parse(req.body);
    const studentPackage = await packagesService.assignPackageToStudent({
      packageId: req.params.id,
      studentId: data.studentId,
      assignedById: req.user!.userId,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      customCredits: data.customCredits,
    });
    res.status(201).json({ studentPackage });
  } catch (error) {
    next(error);
  }
}

export async function grantCreditsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = grantCreditsSchema.parse(req.body);
    const studentPackage = await packagesService.grantStudentCredits({
      studentId: data.studentId,
      credits: data.credits,
      reason: data.reason,
      assignedById: req.user!.userId,
    });
    res.status(201).json({ studentPackage });
  } catch (error) {
    next(error);
  }
}

export async function validateCouponHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const result = await packagesService.validateCoupon(code, Number(amount) || 0);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listCouponsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const coupons = await packagesService.listCoupons();
    res.json({ coupons });
  } catch (error) {
    next(error);
  }
}

export async function createCouponHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const coupon = await packagesService.createCoupon(req.body);
    res.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
}

export async function deleteCouponHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await packagesService.deleteCoupon(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
}
