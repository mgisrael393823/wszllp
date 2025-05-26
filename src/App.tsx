import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { EFileProvider } from './context/EFileContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import AcceptInvitationPage from './components/auth/AcceptInvitationPage';
import DebugInvitationPage from './components/auth/DebugInvitationPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import EnhancedDashboardHome from './components/dashboard/EnhancedDashboardHome';
const CaseList = React.lazy(() => import('./components/cases/CaseList'));
import CaseDetail from './components/cases/CaseDetail';
const NewCasePage = React.lazy(() => import('./components/cases/NewCasePage'));
import CasesPage from './components/cases/CasesPage';
import CaseSkeleton from './components/cases/CaseSkeleton';
import HearingsPage from './components/hearings/HearingsPage';
import HearingForm from './components/hearings/HearingForm';
import DocumentList from './components/documents/DocumentList';
import DocumentManagement from './components/documents/DocumentManagement';
import DocumentUploadForm from './components/documents/DocumentUploadForm';
import DocumentDetail from './components/documents/DocumentDetail';
import DocumentUpload from './components/documents/DocumentUpload';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceDetail from './components/invoices/InvoiceDetail';
import ServiceLogsList from './components/service-logs/ServiceLogsList';
import EFilePage from './components/efile/EFilePage';
import AdminPage from './components/admin/AdminPage';
import WorkflowDashboard from './components/workflows/WorkflowDashboard';
import WorkflowDetail from './components/workflows/WorkflowDetail';
import TemplateList from './components/document-templates/TemplateList';
import TemplateDetail from './components/document-templates/TemplateDetail';
import DocumentGenerator from './components/document-templates/DocumentGenerator';
import CalendarPage from './components/calendar/CalendarPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import NotificationScheduler from './components/notifications/NotificationScheduler';
import ContactsPage from './components/contacts/ContactsPage';
import ActivityPage from './components/activity/ActivityPage';
import ProfilePage from './components/user/ProfilePage';
import SettingsPage from './components/user/SettingsPage';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Placeholder for Design System - removed in MVP
const DesignSystemPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Design System</h1>
    <p>The design system showcase has been deferred for the MVP.</p>
  </div>
);

// Component to handle navigation logic
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Update activeSection based on current route
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    setActiveSection(path);
  }, [location.pathname]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    
    // Use window.location.href to handle the design system route which is outside the normal app layout
    if (section === 'design-system') {
      window.location.href = '/design-system';
      return;
    }
    
    navigate(`/${section}`);
  };
  
  // Check if we're on the design system route
  const isDesignSystem = location.pathname === '/design-system';
  
  // If we're on the design system page, render it without the main layout
  if (isDesignSystem) {
    return <DesignSystemPage />;
  }
  
  return (
    <MainLayout 
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    >
      <NotificationScheduler />
      <ErrorBoundary>
        <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<EnhancedDashboardHome />} />
        <Route path="/cases" element={<CasesPage />}>
          <Route index element={
            <Suspense fallback={<CaseSkeleton />}>
              <CaseList />
            </Suspense>
          } />
          <Route path="new" element={
            <Suspense fallback={<CaseSkeleton />}>
              <NewCasePage />
            </Suspense>
          } />
        </Route>
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/hearings" element={<HearingsPage />} />
        <Route path="/hearings/new" element={
          <div className="page-container">
            <div className="page-header">
              <h1 className="page-title">Add New Hearing</h1>
            </div>
            <HearingForm 
              isOpen={true}
              onClose={() => window.history.back()}
              hearingId={null}
              standalone={true}
            />
          </div>
        } />
        <Route path="/hearings/:id" element={
          <div className="page-container">
            <div className="page-header">
              <h1 className="page-title">Edit Hearing</h1>
            </div>
            <HearingForm 
              isOpen={true}
              onClose={() => window.history.back()}
              hearingId={null}
              standalone={true}
            />
          </div>
        } />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/documents" element={<DocumentManagement />}>
          <Route index element={<DocumentList />} />
          <Route path="upload" element={<DocumentUploadForm />} />
          <Route path="efile" element={<EFilePage />} />
          <Route path="service-logs" element={<ServiceLogsList />} />
        </Route>
        <Route path="/documents/new" element={<DocumentUpload />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/workflows" element={<WorkflowDashboard />} />
        <Route path="/workflows/:id" element={<WorkflowDetail />} />
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/document-generator" element={<DocumentGenerator />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/contacts/*" element={<ContactsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </ErrorBoundary>
    </MainLayout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <ToastProvider>
          <AuthProvider>
            <EFileProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
                  <Route path="/debug-invitation" element={<DebugInvitationPage />} />
                  <Route path="/design-system" element={<DesignSystemPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/*" element={<AppContent />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </EFileProvider>
          </AuthProvider>
        </ToastProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}

export default App;