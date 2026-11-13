import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../lib/cache';

/**
 * Checks if the authenticated user has a specific granular permission code.
 * SUPER_ADMIN bypasses all checks.
 * Uses high-performance caching (Redis/Memory) with 5 min TTL.
 */
export function requirePermission(permissionCode: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
        return next();
      }

      const roleName = req.user.role;
      const cacheKey = `rbac:permissions:${roleName}`;

      const userPermissions = await getCachedOrFetch<string[]>(cacheKey, 300, async () => {
        const roleDef = await prisma.roleDefinition.findFirst({
          where: { name: roleName },
          include: {
            permissions: {
              where: { granted: true },
              include: { permission: true },
            },
          },
        });

        if (!roleDef) return [];
        return roleDef.permissions.map((rp) => rp.permission.code);
      });

      if (!userPermissions.includes(permissionCode)) {
        return res.status(403).json({
          error: `Access Denied: Missing required permission [${permissionCode}]`,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      return res.status(500).json({ error: 'Internal authorization error' });
    }
  };
}

export async function invalidateRolePermissionCache(roleName?: string) {
  if (roleName) {
    await cacheInvalidatePrefix(`rbac:permissions:${roleName}`);
  } else {
    await cacheInvalidatePrefix('rbac:permissions:');
  }
}
