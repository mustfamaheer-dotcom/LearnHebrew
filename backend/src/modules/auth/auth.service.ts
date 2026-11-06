import { prisma } from '../../config/database';
import { comparePassword, hashPassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { logAuditEvent } from '../../utils/audit';
import crypto from 'crypto';

export async function login(
  email: string,
  pass: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      studentProfile: true,
      teacherProfile: true,
    },
  });

  if (!user) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  if (!user.isActive) {
    throw { status: 403, message: 'Account is deactivated. Please contact admin.' };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw {
      status: 403,
      message: `Account is locked until ${user.lockedUntil.toLocaleTimeString()}`,
    };
  }

  const isMatch = await comparePassword(pass, user.passwordHash);
  // Strict check: Only permit dev password bypass when explicitly enabled in local development
  const isDevBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_DEV_LOGIN_BYPASS === 'true' &&
    (pass === 'password123' || pass === 'password');
  const isValid = isMatch || isDevBypass;
  if (!isValid) {
    const failedLogins = user.failedLogins + 1;
    let lockedUntil: Date | null = null;
    if (failedLogins >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins, lockedUntil },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
      metaJson: { failedAttempts: failedLogins },
    });

    throw { status: 401, message: 'Invalid credentials' };
  }

  // Reset failed logins on success
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

