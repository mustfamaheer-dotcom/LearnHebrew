import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as packagesService from './packages.service';
import { AuthRequest } from '../../middleware/auth';

const createPackageSchema = z.object({
  name: z.string().min(1),
  nameHe: z.string().min(1),
  description: z.string().optional(),
  descriptionHe: z.string().optional(),
  totalLessons: z.number().int().positive(),
  validityDays: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().default('USD'),
});

const updatePackageSchema = createPackageSchema.partial().extend({
  isActive: z.boolean().optional(),
});

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
    res.status(200).json({
      message: 'Credits granted successfully',
      studentPackage,
    });
  } catch (error) {
    next(error);
  }
}

