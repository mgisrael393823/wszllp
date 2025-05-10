import React from 'react';
import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import DataImportTool from './DataImportTool';
import SimpleImportTool from './SimpleImportTool';
import DataImportWrapper from './DataImportWrapper';
import EnhancedDataImporter from './EnhancedDataImporter';
import ErrorBoundary from '../ui/ErrorBoundary';
import { Database, Settings, Shield, Users, Upload, RefreshCw } from 'lucide-react';

/**
 * Consolidated AdminPage using the Tabs component
 * This eliminates duplicate navigation and search bars across tabs
 */
const AdminPage: React.FC = () => {
  const adminTabs = [
    { 
      id: 'import', 
      label: 'Legacy Import', 
      icon: <Database className="w-5 h-5" />,
      content: (
        <Card className="p-6">
          <ErrorBoundary>
            <DataImportTool />
          </ErrorBoundary>
        </Card>
      )
    },
    { 
      id: 'enhanced-import', 
      label: 'Simple Import', 
      icon: <Upload className="w-5 h-5" />,
      content: (
        <Card className="p-6">
          <ErrorBoundary>
            <SimpleImportTool />
          </ErrorBoundary>
        </Card>
      )
    },
    { 
      id: 'flex-import', 
      label: 'Flexible Import', 
      icon: <RefreshCw className="w-5 h-5" />,
      content: (
        <ErrorBoundary>
          <DataImportWrapper />
        </ErrorBoundary>
      )
    },
    { 
      id: 'advanced-import', 
      label: 'Advanced Import', 
      icon: <Upload className="w-5 h-5" />,
      content: (
        <Card className="p-6">
          <ErrorBoundary>
            <EnhancedDataImporter />
          </ErrorBoundary>
        </Card>
      )
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />,
      content: (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-gray-500">Settings will be available in a future update.</p>
        </Card>
      )
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: <Users className="w-5 h-5" />,
      content: (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-500">User management will be available in a future update.</p>
        </Card>
      )
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: <Shield className="w-5 h-5" />,
      content: (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
          <p className="text-gray-500">Security settings will be available in a future update.</p>
        </Card>
      )
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-gray-600">System administration and data management</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <Tabs 
          tabs={adminTabs} 
          defaultValue="flex-import"
          variant="underline"
        />
      </div>
    </div>
  );
};

export default AdminPage;