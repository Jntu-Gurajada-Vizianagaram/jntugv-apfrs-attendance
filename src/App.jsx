import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AttendanceProvider } from './contexts/AttendanceContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import DashboardLayout from './components/layout/DashboardLayout';
import MoveToTop from './components/MoveToTop';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyApplyLeaves from './pages/FacultyApplyLeaves';
import PrincipalLeaveApprovals from './pages/PrincipalLeaveApprovals';
import Administration from './pages/Administration';
import AcademicCalendar from './pages/AcademicCalendar';
import ImportData from './pages/ImportData';
import HomePage from './pages/HomePage';
import FacultySummary from './pages/FacultySummary';
import DetailedView from './pages/DetailedView';
import WeeklyReport from './pages/WeeklyReport';
import DepartmentReport from './pages/DepartmentReport';
import DailyReport from './pages/DailyReport';
import EmailPreview from './pages/EmailPreview';
import StatusDashboard from './pages/StatusDashboard';
import ConsolidatedReport from './pages/ConsolidatedReport';

const AppRoutes = () => {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Role-Based Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Faculty Leave Application Route (CL, OD, SL, AL) */}
      <Route
        path="/user/apply-leaves"
        element={
          <ProtectedRoute>
            <FacultyApplyLeaves />
          </ProtectedRoute>
        }
      />

      {/* Principal Leave Approvals Route */}
      <Route
        path="/admin/leave-approvals"
        element={
          <ProtectedRoute requiredRole="admin">
            <PrincipalLeaveApprovals />
          </ProtectedRoute>
        }
      />

      {/* Overview / Data Upload Page */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Management & Configuration Pages */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AcademicCalendar />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Administration />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty-summary"
        element={
          <ProtectedRoute requiredRole="admin">
            <FacultySummary />
          </ProtectedRoute>
        }
      />

      {/* Executive Consolidated Report — Strictly Admin / Executive Only */}
      <Route
        path="/consolidated-report"
        element={
          <ProtectedRoute requiredRole="admin">
            <ConsolidatedReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/status-dashboard"
        element={
          <ProtectedRoute>
            <StatusDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/email-preview"
        element={
          <ProtectedRoute>
            <EmailPreview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/detailed"
        element={
          <ProtectedRoute requiredRole="admin">
            <DetailedView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/department"
        element={
          <ProtectedRoute requiredRole="admin">
            <DepartmentReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily/:year/:month/:day"
        element={
          <ProtectedRoute requiredRole="admin">
            <DailyReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/weekly/:year/:month/:week"
        element={
          <ProtectedRoute requiredRole="admin">
            <WeeklyReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/summary/:year/:month"
        element={
          <ProtectedRoute requiredRole="admin">
            <FacultySummary />
          </ProtectedRoute>
        }
      />

      <Route path="/import" element={<ProtectedRoute><ImportData /></ProtectedRoute>} />

      {/* Default Root Redirect */}
      <Route
        path="/"
        element={<Navigate to={isAdmin ? "/admin/dashboard" : "/user/dashboard"} replace />}
      />

      <Route
        path="*"
        element={<Navigate to={isAdmin ? "/admin/dashboard" : "/user/dashboard"} replace />}
      />
    </Routes>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <>
        <AppRoutes />
        <MoveToTop />
      </>
    );
  }

  return (
    <DashboardLayout>
      <AppRoutes />
      <MoveToTop />
    </DashboardLayout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <Router>
          <AppContent />
        </Router>
      </AttendanceProvider>
    </AuthProvider>
  );
};

export default App;
