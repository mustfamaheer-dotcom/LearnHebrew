import { prisma } from '../../config/database';
import { comparePassword, hashPassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { logAuditEvent } from '../../utils/audit';
import { logSystemEvent } from '../../utils/systemLogger';
import { LogCategory, LogLevel } from '@prisma/client';
import crypto from 'crypto';

// Pre-computed bcrypt hash of a random 32-char string with cost 12 to eliminate timing side-channels
const DUMMY_BCRYPT_HASH = '$2a$12$e8kP60k7eP8N0/c7GqFw3e1E7wNqF0/e8kP60k7eP8N0/c7GqFw3e';
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function login(
  email: string,
  pass: string,
  ipAddress?: string,
  userAgent?: string
) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      studentProfile: true,
      teacherProfile: true,
    },
  });

  if (!user) {
    // Constant-time mitigation against user enumeration
    await comparePassword(pass, DUMMY_BCRYPT_HASH);
    throw { status: 401, message: 'Invalid credentials' };
  }

  if (!user.isActive) {
    throw { status: 403, message: 'Account is deactivated. Please contact administrator.' };
  }

  const now = new Date();

  // 1. Check if user account is currently locked out
  if (user.lockedUntil) {
    if (user.lockedUntil > now) {
      const remainingMs = user.lockedUntil.getTime() - now.getTime();
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeRemainingLabel =
        minutes > 0
          ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
          : `${seconds} second${seconds !== 1 ? 's' : ''}`;

      await logSystemEvent({
        level: LogLevel.WARN,
        category: LogCategory.SECURITY,
        message: `Blocked login attempt on locked account: ${user.email} (${timeRemainingLabel} remaining)`,
        userId: user.id,
        ipAddress,
        userAgent,
        meta: { email: user.email, lockedUntil: user.lockedUntil, remainingSeconds },
      });

      throw {
        status: 429,
        message: `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in ${timeRemainingLabel}.`,
        retryAfterSeconds: remainingSeconds,
        lockedUntil: user.lockedUntil.toISOString(),
        remainingAttempts: 0,
      };
    } else {
      // Lockout window has passed. Reset failedLogins counter for a fresh window!
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
      user.failedLogins = 0;
      user.lockedUntil = null;
    }
  }

  // 2. Validate Password
  const isMatch = await comparePassword(pass, user.passwordHash);
  // Strict check: Only permit dev password bypass when explicitly enabled in local development
  const isDevBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_DEV_LOGIN_BYPASS === 'true' &&
    (pass === 'password123' || pass === 'password');
  const isValid = isMatch || isDevBypass;

  // 3. Handle Login Failure (Strict 5-Attempt Lockout Policy)
  if (!isValid) {
    const newFailedLogins = user.failedLogins + 1;

    // Threshold reached: Lock user for 15 minutes immediately
    if (newFailedLogins >= MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockoutExpiry = new Date(Date.now() + ACCOUNT_LOCKOUT_MS);

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: newFailedLogins, lockedUntil: lockoutExpiry },
      });

      await logAuditEvent({
        userId: user.id,
        action: 'ACCOUNT_LOCKED_5_FAILURES',
        ipAddress,
        userAgent,
        metaJson: { failedAttempts: newFailedLogins, lockedUntil: lockoutExpiry },
      });

      await logSystemEvent({
        level: LogLevel.CRITICAL,
        category: LogCategory.SECURITY,
        message: `Account locked: ${user.email} after ${newFailedLogins} consecutive failed login attempts (15 min lockout)`,
        userId: user.id,
        ipAddress,
        userAgent,
        meta: { email: user.email, failedAttempts: newFailedLogins, lockedUntil: lockoutExpiry },
      });

      throw {
        status: 429,
        message: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
        retryAfterSeconds: 15 * 60,
        lockedUntil: lockoutExpiry.toISOString(),
        remainingAttempts: 0,
      };
    }

    // User still has remaining attempts before lockout (< 5)
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: newFailedLogins },
    });

    const remainingAttempts = MAX_FAILED_LOGIN_ATTEMPTS - newFailedLogins;

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
      metaJson: { failedAttempts: newFailedLogins, remainingAttempts },
    });

    await logSystemEvent({
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
      message: `Failed login attempt for ${user.email} (${newFailedLogins}/${MAX_FAILED_LOGIN_ATTEMPTS}, ${remainingAttempts} remaining)`,
      userId: user.id,
      ipAddress,
      userAgent,
      meta: { email: user.email, failedAttempts: newFailedLogins, remainingAttempts },
    });

    throw {
      status: 401,
      message: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before a 15-minute account lockout.`,
      remainingAttempts,
    };
  }

  // 4. Handle Success: Reset failedLogins counter & lockout status
  if (user.failedLogins > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    });
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store hashed refresh token in DB
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    ipAddress,
    userAgent,
  });

  const { passwordHash: _, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

export async function refreshToken(oldToken: string, ipAddress?: string, userAgent?: string) {
  const payload = verifyRefreshToken(oldToken);
  const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: oldHash },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    // Possible token reuse attack: revoke all tokens for this user family
    if (storedToken?.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId },
        data: { revoked: true },
      });
      await logAuditEvent({
        userId: payload.userId,
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        ipAddress,
        userAgent,
      });
    }
    throw { status: 401, message: 'Invalid or revoked refresh token' };
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // Issue new tokens (Token rotation)
  const newPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
  const accessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshTokenStr: string, userId?: string) {
  const hash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash },
    data: { revoked: true },
  });

  if (userId) {
    await logAuditEvent({
      userId,
      action: 'LOGOUT',
    });
  }
}

export async function changePassword(userId: string, oldPass: string, newPass: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  const valid = await comparePassword(oldPass, user.passwordHash);
  if (!valid) throw { status: 400, message: 'Incorrect current password' };

  const newHash = await hashPassword(newPass);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, mustChangePw: false },
  });

  await logAuditEvent({
    userId,
    action: 'PASSWORD_CHANGED',
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: {
        include: {
          packages: {
            where: { status: 'ACTIVE' },
            include: { package: true },
          },
        },
      },
      teacherProfile: true,
    },
  });

  if (!user) throw { status: 404, message: 'User not found' };
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

