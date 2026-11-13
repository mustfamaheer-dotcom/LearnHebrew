import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && typeof req.query.token === 'string') {
      token = req.query.token;
    } else if ((req as any).cookies?.accessToken) {
      token = (req as any).cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const payload = verifyAccessToken(token);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true, lockedUntil: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User is inactive or not found' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    if (!roles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    next();
  };
}

