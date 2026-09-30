import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    let user = null;
    try {
      user = rawUser ? JSON.parse(rawUser) : null;
    } catch (e) {
      user = null;
    }

    if (!user || user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
