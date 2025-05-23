import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { EFileProvider } from './context/EFileContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import CaseList from './components/cases/CaseList';
import CaseDetail from './components/cases/CaseDetail';
import CasesPage from './components/cases/CasesPage';
import HearingsPage from './components/hearings/HearingsPage';
import DocumentList from './components/documents/DocumentList';
import DocumentManagement from './components/documents/DocumentManagement';
import DocumentUploadForm from './components/documents/DocumentUploadForm';
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
import ProfilePage from './components/user/ProfilePage';
import SettingsPage from './components/user/SettingsPage';

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
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/list" element={<CaseList />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/hearings/*" element={<HearingsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/documents" element={<DocumentManagement />} />
        <Route path="/documents/list" element={<DocumentList />} />
        <Route path="/documents/upload" element={<DocumentUploadForm />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/service-logs" element={<ServiceLogsList />} />
        <Route path="/efile" element={<EFilePage />} />
        <Route path="/workflows" element={<WorkflowDashboard />} />
        <Route path="/workflows/:id" element={<WorkflowDetail />} />
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/document-generator" element={<DocumentGenerator />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/contacts/*" element={<ContactsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <AuthProvider>
          <EFileProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
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
  );
}

export default App;