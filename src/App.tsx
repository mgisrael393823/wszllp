import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import CaseList from './components/cases/CaseList';
import CaseDetail from './components/cases/CaseDetail';
import CasesPage from './components/cases/CasesPage';
import HearingList from './components/hearings/HearingList';
import DocumentList from './components/documents/DocumentList';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceDetail from './components/invoices/InvoiceDetail';
import ServiceLogsList from './components/service-logs/ServiceLogsList';
import EFilePage from './components/efile/EFilePage';

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
    navigate(`/${section}`);
  };
  
  return (
    <MainLayout 
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/list" element={<CaseList />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/hearings" element={<HearingList />} />
        <Route path="/documents" element={<DocumentList />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/service-logs" element={<ServiceLogsList />} />
        <Route path="/efile" element={<EFilePage />} />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;