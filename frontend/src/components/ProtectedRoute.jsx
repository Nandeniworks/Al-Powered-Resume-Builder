import React from 'react';
import { Navigate } from 'react-router-dom';

function isJwtExpired(token) {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

  if (!token || isJwtExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login?expired=true" replace />;
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
