import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as authService from './auth.service';
import { AuthRequest } from '../../middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50).optional(),
  languagePref: z.enum(['en', 'he']).optional(),
  avatarUrl: z.string().nullable().optional(),
});

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(data.email, data.password, ip, userAgent);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await authService.refreshToken(token, ip, userAgent);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await authService.logout(token, req.user?.userId);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.userId, data.oldPassword, data.newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function meHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Permissions: Only Teachers and Platform Owners (ADMIN / SUPER_ADMIN) can set avatar images
    if (data.avatarUrl !== undefined && data.avatarUrl !== null && data.avatarUrl.trim() !== '') {
      const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Students are not permitted to set profile images. Only Teachers and Platform Owners can customize avatar images.',
        });
      }

      // If avatarUrl is a Base64 data URL (e.g. data:image/webp;base64,...), persist it as a .webp file on disk
      if (data.avatarUrl.startsWith('data:image/')) {
        try {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const base64Data = data.avatarUrl.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `avatar-${userId}-${Date.now()}.webp`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, buffer);
          data.avatarUrl = `/uploads/avatars/${filename}`;
        } catch (fileErr) {
          console.error('Failed to write WebP avatar to disk, persisting data URL directly:', fileErr);
        }
      }
    }

    const user = await authService.updateProfile(userId, data);
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
}

