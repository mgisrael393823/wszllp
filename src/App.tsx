import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import CaseList from './components/cases/CaseList';
import CaseDetail from './components/cases/CaseDetail';
import HearingList from './components/hearings/HearingList';
import DocumentList from './components/documents/DocumentList';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceDetail from './components/invoices/InvoiceDetail';
import ServiceLogsList from './components/service-logs/ServiceLogsList';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <DataProvider>
      <BrowserRouter>
        <MainLayout 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/hearings" element={<HearingList />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/service-logs" element={<ServiceLogsList />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;