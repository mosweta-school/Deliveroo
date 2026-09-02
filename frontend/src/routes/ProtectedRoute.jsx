import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Wrap any route element to require login, and optionally a specific role.
 *
 *   <Route path="/customer" element={
 *     <ProtectedRoute allowedRoles={['customer']}>
 *       <CustomerDashboard />
 *     </ProtectedRoute>
 *   } />
 *
 *   <Route path="/admin" element={
 *     <ProtectedRoute allowedRoles={['admin']}>
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   } />
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Logged in, just the wrong role — send them to their own dashboard
    // instead of an error page.
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/customer'} replace />;
  }

  return children;
};

export default ProtectedRoute;
