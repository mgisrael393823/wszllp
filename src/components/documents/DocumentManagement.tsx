import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FileText, Upload, Truck, Plus } from 'lucide-react';
import TabBar, { TabItem } from '../ui/TabBar';
import Button from '../ui/Button';

/**
 * Document Management component
 * Central hub for all document-related features with tab navigation
 */
const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // Define tabs for the Documents section
  const tabs: TabItem[] = [
    {
      label: 'Documents',
      value: 'list',
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
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Manage legal documents, filings, and service attempts</p>
        </div>
        <div className="page-actions">
          <Button 
            variant="primary" 
            icon={<Plus size={16} />}
            onClick={() => navigate('/documents/upload')}
          >
            Add Document
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 backdrop-blur-sm pb-2 -mx-6 px-6">
        <TabBar tabs={tabs} />
      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
};

export default DocumentManagement;