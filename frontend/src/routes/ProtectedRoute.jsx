// frontend/src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if role matches (if required)
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'customer') {
      return <Navigate to="/customer" replace />;
    }else if (user?.role === 'driver') {
      return <Navigate to="/rider" replace />;
    } return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;