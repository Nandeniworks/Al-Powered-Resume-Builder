import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateResumePage from './pages/CreateResumePage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import SharePage from './pages/SharePage';
import TemplatesPage from './pages/TemplatesPage';
import TailorPage from './pages/TailorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminTemplatesPage from './pages/AdminTemplatesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { auth } from './firebase';

export default function App() {
  useEffect(() => {
    // Verify Firebase initialization on app start
    if (auth) {
      console.log('Firebase initialized successfully in ResumeCraft Frontend');
    }
  }, []);

  const hasToken = !!localStorage.getItem('token');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to={hasToken ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/share/:shareId" element={<SharePage />} />

        {/* Authenticated Studio Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-resume"
          element={
            <ProtectedRoute>
              <CreateResumePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume/new"
          element={
            <ProtectedRoute>
              <ResumeBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume/:id/edit"
          element={
            <ProtectedRoute>
              <ResumeBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-suggestions"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/tailor"
          element={
            <ProtectedRoute>
              <TailorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/admin/templates"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminTemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={hasToken ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
