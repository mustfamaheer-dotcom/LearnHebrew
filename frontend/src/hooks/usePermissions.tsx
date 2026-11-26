import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

/**
 * Dynamic Role & Granular Permissions Hook.
 * Controls tabs visibility, operational action gates, and feature access.
 * Automatically synchronizes with dynamic RBAC customizations made in Admin Matrix.
 */
export function usePermissions() {
  const { user } = useAuthStore();

  const { data: myPermissionsData, isLoading } = useQuery({
    queryKey: ['myPermissions', user?.role, user?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/roles/my-permissions');
        return (res.data?.permissions as string[]) || [];
      } catch {
        return user?.permissions || [];
      }
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 min cache
    initialData: user?.permissions || [],
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const permissions = useMemo<string[]>(() => {
    if (myPermissionsData && myPermissionsData.length > 0) {
      return myPermissionsData;
    }
    return user?.permissions || [];
  }, [myPermissionsData, user?.permissions]);

  const can = useCallback(
    (permissionCode?: string): boolean => {
      if (!permissionCode) return true;
      if (isSuperAdmin) return true;
      if (permissionCode === 'shorts:view') return true;
      if (permissionCode === 'shorts:manage' && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) return true;
      return permissions.includes(permissionCode);
    },
    [isSuperAdmin, permissions, user?.role]
  );

  const canAny = useCallback(
    (codes: string[]): boolean => {
      if (isSuperAdmin) return true;
      if (!codes || codes.length === 0) return true;
      return codes.some((code) => permissions.includes(code));
    },
    [isSuperAdmin, permissions]
  );

  const canAll = useCallback(
    (codes: string[]): boolean => {
      if (isSuperAdmin) return true;
      if (!codes || codes.length === 0) return true;
      return codes.every((code) => permissions.includes(code));
    },
    [isSuperAdmin, permissions]
  );

  return {
    permissions,
    can,
    canAny,
    canAll,
    isSuperAdmin,
    isLoading,
  };
}

interface CanProps {
  permission?: string;
  any?: string[];
  all?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  any,
  all,
  fallback = null,
  children,
}) => {
  const { can, canAny, canAll } = usePermissions();

  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  if (any && any.length > 0 && !canAny(any)) {
    return <>{fallback}</>;
  }

  if (all && all.length > 0 && !canAll(all)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
