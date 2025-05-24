import React from 'react';
import { Outlet } from 'react-router-dom';
import { FileText, Upload, Truck } from 'lucide-react';
import TabBar, { TabItem } from '../ui/TabBar';

/**
 * Document Management component
 * Central hub for all document-related features with tab navigation
 */
const DocumentManagement: React.FC = () => {
  // Define tabs for the Documents section
  const tabs: TabItem[] = [
    {
      label: 'All Documents',
      value: 'all',
      route: '/documents',
      icon: <FileText size={16} />
    },
    {
      label: 'Upload',
      value: 'upload',
      route: '/documents/upload',
      icon: <Upload size={16} />
    },
    {
      label: 'eFiling',
      value: 'efile',
      route: '/documents/efile',
      icon: <Upload size={16} />
    },
    {
      label: 'Service Logs',
      value: 'service-logs',
      route: '/documents/service-logs',
      icon: <Truck size={16} />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Documents</h1>
          <p className="text-neutral-600 mt-1">Manage legal documents, filings, and service attempts</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabBar tabs={tabs} className="sticky top-0 bg-white z-10" />

      {/* Tab Content */}
      <div className="min-h-96">
        <Outlet />
      </div>
    </div>
  );
};

export default DocumentManagement;