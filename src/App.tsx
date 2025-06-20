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
const DocumentList = React.lazy(() => import('./components/documents/DocumentList'));
const DocumentManagement = React.lazy(() => import('./components/documents/DocumentManagement'));
const DocumentUploadForm = React.lazy(() => import('./components/documents/DocumentUploadForm'));
const DocumentDetail = React.lazy(() => import('./components/documents/DocumentDetail'));
const InvoicesPage = React.lazy(() => import('./components/invoices/InvoicesPage'));
const InvoiceDetail = React.lazy(() => import('./components/invoices/InvoiceDetail'));
const ServiceLogsList = React.lazy(() => import('./components/service-logs/ServiceLogsList'));
const EFilePage = React.lazy(() => import('./components/efile/EFilePage'));
const AdminPage = React.lazy(() => import('./components/admin/AdminPage'));
const WorkflowDashboard = React.lazy(() => import('./components/workflows/WorkflowDashboard'));
const WorkflowDetail = React.lazy(() => import('./components/workflows/WorkflowDetail'));
const TemplateList = React.lazy(() => import('./components/document-templates/TemplateList'));
const TemplateDetail = React.lazy(() => import('./components/document-templates/TemplateDetail'));
const DocumentGenerator = React.lazy(() => import('./components/document-templates/DocumentGenerator'));
const CalendarPage = React.lazy(() => import('./components/calendar/CalendarPage'));
const NotificationsPage = React.lazy(() => import('./components/notifications/NotificationsPage'));
const NotificationScheduler = React.lazy(() => import('./components/notifications/NotificationScheduler'));
const ContactsPage = React.lazy(() => import('./components/contacts/ContactsPage'));
const ActivityPage = React.lazy(() => import('./components/activity/ActivityPage'));
const ProfilePage = React.lazy(() => import('./components/user/ProfilePage'));
const SettingsPage = React.lazy(() => import('./components/user/SettingsPage'));
import ErrorBoundary from './components/ui/ErrorBoundary';
import CardTestPage from './components/ui/CardTestPage';
import CardShowcase from './components/ui/CardShowcase';

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
        <Route path="/dashboard/cases/:id" element={<CaseDetail />} />
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
        <Route
          path="/calendar"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading calendar...</div>}>
              <CalendarPage />
            </Suspense>
          }
        />
        <Route
          path="/documents"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading documents...</div>}>
              <DocumentManagement />
            </Suspense>
          }
        >
          <Route index element={
            <Suspense fallback={<div className="p-8 text-center">Loading documents...</div>}>
              <DocumentList />
            </Suspense>
          } />
          <Route
            path="upload"
            element={
              <Suspense fallback={<div className="p-4">Loading upload form...</div>}>
                <DocumentUploadForm />
              </Suspense>
            }
          />
          <Route
            path="efile"
            element={
              <Suspense fallback={<div className="p-4">Loading e-file...</div>}>
                <EFilePage />
              </Suspense>
            }
          />
          <Route
            path="service-logs"
            element={
              <Suspense fallback={<div className="p-4">Loading service logs...</div>}>
                <ServiceLogsList />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/documents/:id"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading document...</div>}>
              <DocumentDetail />
            </Suspense>
          }
        />
        <Route
          path="/invoices"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading invoices...</div>}>
              <InvoicesPage />
            </Suspense>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading invoice...</div>}>
              <InvoiceDetail />
            </Suspense>
          }
        />
        <Route
          path="/workflows"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading workflows...</div>}>
              <WorkflowDashboard />
            </Suspense>
          }
        />
        <Route
          path="/workflows/:id"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading workflow...</div>}>
              <WorkflowDetail />
            </Suspense>
          }
        />
        <Route
          path="/templates"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading templates...</div>}>
              <TemplateList />
            </Suspense>
          }
        />
        <Route
          path="/templates/:id"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading template...</div>}>
              <TemplateDetail />
            </Suspense>
          }
        />
        <Route
          path="/document-generator"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading generator...</div>}>
              <DocumentGenerator />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading admin...</div>}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route
          path="/notifications"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading notifications...</div>}>
              <NotificationsPage />
            </Suspense>
          }
        />
        <Route
          path="/activity"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading activity...</div>}>
              <ActivityPage />
            </Suspense>
          }
        />
        <Route
          path="/contacts/*"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading contacts...</div>}>
              <ContactsPage />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading profile...</div>}>
              <ProfilePage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<div className="p-8 text-center">Loading settings...</div>}>
              <SettingsPage />
            </Suspense>
          }
        />
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
                  <Route path="/card-test" element={<CardTestPage />} />
                  <Route path="/card-showcase" element={<CardShowcase />} />
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