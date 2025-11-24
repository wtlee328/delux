import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'supplier' | 'agency' | 'super_admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const hasPermission =
      allowedRoles.includes(user.role) ||
      (user.role === 'super_admin' && allowedRoles.includes('admin'));

    if (!hasPermission) {
      // Redirect to appropriate dashboard based on user role
      switch (user.role) {
        case 'super_admin':
          return <Navigate to="/admin/users" replace />;
        case 'admin':
          return <Navigate to="/admin/tours" replace />;
        case 'supplier':
          return <Navigate to="/supplier/dashboard" replace />;
        case 'agency':
          return <Navigate to="/agency/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
