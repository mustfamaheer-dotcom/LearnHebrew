import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, accessToken } = useAuthStore();
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('learnhebrew_token') : null;
  const storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('learnhebrew_user') : null;

  const effectiveToken = accessToken || storedToken;
  const effectiveUser = user || (storedUserRaw ? JSON.parse(storedUserRaw) : null);

  if (!effectiveToken || !effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // SUPER_ADMIN and ADMIN have access to admin-level sections
    if (effectiveUser.role !== 'SUPER_ADMIN' && !allowedRoles.includes(effectiveUser.role)) {
      // Redirect to user's appropriate home
      if (effectiveUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
      if (effectiveUser.role === 'TEACHER') return <Navigate to="/teacher" replace />;
      if (effectiveUser.role === 'STUDENT') return <Navigate to="/student" replace />;
      if (effectiveUser.role === 'SALES') return <Navigate to="/sales" replace />;
      if (effectiveUser.role === 'CS') return <Navigate to="/cs" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

