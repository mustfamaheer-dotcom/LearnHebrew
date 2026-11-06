import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as usersService from './users.service';
import { AuthRequest } from '../../middleware/auth';
import { Role, HebrewLevel } from '@prisma/client';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role),
  languagePref: z.enum(['en', 'he']).optional(),
  level: z.nativeEnum(HebrewLevel).optional(), // For students
  bio: z.string().optional(), // For teachers
  specialties: z.array(z.string()).optional(), // For teachers
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  languagePref: z.enum(['en', 'he']).optional(),
  level: z.nativeEnum(HebrewLevel).optional(),
  notes: z.string().optional(),
  totalPoints: z.number().int().min(0).optional(),
  streakDays: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

export async function listUsersHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const role = req.query.role as Role | undefined;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const users = await usersService.listUsers({ role, search, isActive });
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function createUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await usersService.createUser({
      ...data,
      createdById: req.user!.userId,
    });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function getUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await usersService.updateUser(req.params.id, data);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await usersService.deactivateUser(req.params.id);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const newPassword = req.body.newPassword || 'LearnHebrew@2026';
    await usersService.forceResetPassword(req.params.id, newPassword);
    res.json({ message: 'Password reset successfully', tempPassword: newPassword });
  } catch (error) {
    next(error);
  }
}

export async function adjustStudentBalanceHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { amount, mode, reason } = req.body;
    if (amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid numeric amount is required' });
    }
    const student = await usersService.adjustStudentBalance(
      req.params.id,
      Number(amount),
      mode || 'add',
      reason,
      req.user!.userId
    );
    res.json({ message: 'Student balance updated successfully', student });
  } catch (error) {
    next(error);
  }
}

