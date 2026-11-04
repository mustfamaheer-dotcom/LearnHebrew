import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, accessToken } = useAuthStore();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // SUPER_ADMIN has access to everything
    if (user.role !== 'SUPER_ADMIN' && !allowedRoles.includes(user.role)) {
      // Redirect to user's appropriate home
      if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
      if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

