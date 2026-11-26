import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as usersService from './users.service';
import { AuthRequest } from '../../middleware/auth';
import { Role, HebrewLevel } from '@prisma/client';

const createUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  parentId: z.string().optional(),
  isParent: z.boolean().optional(),
  familyRole: z.string().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role).optional(),
  roleDefinitionId: z.string().optional(),
  languagePref: z.enum(['en', 'he', 'ar']).optional(),
  nativeLanguageId: z.string().optional(),
  learningLanguageId: z.string().optional(),
  levelId: z.string().optional(),
  level: z.nativeEnum(HebrewLevel).optional(),
  packageId: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isParent: z.boolean().optional(),
  familyRole: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  roleDefinitionId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  languagePref: z.enum(['en', 'he', 'ar']).optional(),
  nativeLanguageId: z.string().nullable().optional(),
  learningLanguageId: z.string().nullable().optional(),
  levelId: z.string().nullable().optional(),
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

export async function updateNotificationPreferencesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.id === 'me' ? req.user!.userId : req.params.id;
    const updated = await usersService.updateNotificationPreferences(targetUserId, req.body);
    res.json({ preferences: updated });
  } catch (error) {
    next(error);
  }
}

export async function getFamilyHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const family = await usersService.getFamilyForUser(req.params.id);
    res.json(family);
  } catch (error) {
    next(error);
  }
}

export async function createChildHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parentId = req.params.id;
    const data = createUserSchema.parse({
      ...req.body,
      parentId,
      role: Role.STUDENT,
      isParent: false,
      familyRole: req.body.familyRole || 'CHILD',
    });
    const child = await usersService.createUser({
      ...data,
      createdById: req.user!.userId,
    });
    res.status(201).json({ user: child });
  } catch (error) {
    next(error);
  }
}

export async function linkFamilyHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parentId = req.params.id;
    const { childUserId, familyRole } = req.body;
    if (!childUserId) {
      return res.status(400).json({ message: 'childUserId is required' });
    }
    const updated = await usersService.linkFamily(parentId, childUserId, familyRole);
    res.json({ user: updated, message: 'Child successfully linked to parent' });
  } catch (error) {
    next(error);
  }
}

export async function unlinkFamilyHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const childUserId = req.params.id;
    const updated = await usersService.unlinkFamily(childUserId);
    res.json({ user: updated, message: 'User unlinked from family' });
  } catch (error) {
    next(error);
  }
}
