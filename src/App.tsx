/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth & Landing
import LandingPage from './pages/landing/LandingPage';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import LoginPage from './pages/auth/LoginPage';
import FaceAuthPage from './pages/auth/FaceAuthPage';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import MedicalRecordsPage from './pages/patient/MedicalRecordsPage';
import NotificationsPage from './pages/patient/NotificationsPage';
import AuditLogsPage from './pages/patient/AuditLogsPage';
import PatientSettingsPage from './pages/patient/SettingsPage';
import ConsentRequestPage from './pages/patient/ConsentRequestPage';
import MedicalPipelinePage from './pages/patient/MedicalPipelinePage';
import MedicalTimelinePage from './pages/patient/MedicalTimelinePage';
import AISummaryPage from './pages/patient/AISummaryPage';
import RiskAnalysisPage from './pages/patient/RiskAnalysisPage';

// Third Party
import ThirdPartyDashboard from './pages/third-party/ThirdPartyDashboard';
import PatientSearchPage from './pages/third-party/PatientSearchPage';
import MedicalHistoryPage from './pages/third-party/MedicalHistoryPage';
import UploadRecordPage from './pages/third-party/UploadRecordPage';
import ModifyRecordPage from './pages/third-party/ModifyRecordPage';
import DeleteRequestPage from './pages/third-party/DeleteRequestPage';
import ConsentStatusPage from './pages/third-party/ConsentStatusPage';
import AccessLogsPage from './pages/third-party/AccessLogsPage';
import TPSettingsPage from './pages/third-party/SettingsPage';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import OrgManagementPage from './pages/admin/OrgManagementPage';
import AccessControlPage from './pages/admin/AccessControlPage';
import AuditMonitoringPage from './pages/admin/AuditMonitoringPage';
import SecurityLogsPage from './pages/admin/SecurityLogsPage';
import PlatformAnalyticsPage from './pages/admin/PlatformAnalyticsPage';
import AdminSettingsPage from './pages/admin/SettingsPage';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login-role" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/404" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    if (user?.role === 'patient') return <Navigate to="/patient" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'doctor') return <Navigate to="/doctor" replace />;
    return <Navigate to="/third-party" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login-role" element={
            <PublicRoute>
              <RoleSelectionPage />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/face-auth" element={<FaceAuthPage />} />

          {/* Patient Routes */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/patient/records" element={<MedicalRecordsPage />} />
            <Route path="/patient/summary" element={<AISummaryPage />} />
            <Route path="/patient/timeline" element={<MedicalTimelinePage />} />
            <Route path="/patient/risk" element={<RiskAnalysisPage />} />
            <Route path="/patient/consent" element={<ConsentRequestPage />} />
            <Route path="/patient/audit" element={<AuditLogsPage />} />
            <Route path="/patient/notifications" element={<NotificationsPage />} />
            <Route path="/patient/settings" element={<PatientSettingsPage />} />
          </Route>

          {/* Third Party Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor', 'lab', 'pharmacist', 'clinic']} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/search" element={<PatientSearchPage />} />
            <Route path="/doctor/upload" element={<UploadRecordPage />} />
            <Route path="/doctor/modify" element={<ModifyRecordPage />} />
            <Route path="/doctor/delete-requests" element={<DeleteRequestPage />} />
            <Route path="/doctor/history" element={<MedicalHistoryPage />} />
            <Route path="/doctor/consent" element={<ConsentStatusPage />} />
            <Route path="/doctor/logs" element={<AccessLogsPage />} />
            <Route path="/doctor/settings" element={<TPSettingsPage />} />
            <Route path="/third-party" element={<ThirdPartyDashboard />} />
            <Route path="/third-party/search" element={<PatientSearchPage />} />
            <Route path="/third-party/upload" element={<UploadRecordPage />} />
            <Route path="/third-party/modify" element={<ModifyRecordPage />} />
            <Route path="/third-party/delete-requests" element={<DeleteRequestPage />} />
            <Route path="/third-party/history" element={<MedicalHistoryPage />} />
            <Route path="/third-party/consent" element={<ConsentStatusPage />} />
            <Route path="/third-party/logs" element={<AccessLogsPage />} />
            <Route path="/third-party/settings" element={<TPSettingsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/orgs" element={<OrgManagementPage />} />
            <Route path="/admin/access" element={<AccessControlPage />} />
            <Route path="/admin/audit" element={<AuditMonitoringPage />} />
            <Route path="/admin/security" element={<SecurityLogsPage />} />
            <Route path="/admin/analytics" element={<PlatformAnalyticsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="/404" element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-slate-900">404</h1>
                <p className="text-xl text-slate-600 mt-4">Page not found</p>
                <Link to="/" className="mt-8 inline-block px-6 py-3 bg-medical-600 text-white rounded-xl font-bold shadow-lg">Go Home</Link>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
