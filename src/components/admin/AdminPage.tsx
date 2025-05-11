import React from 'react';
import Card from '../ui/Card';
import DataImportTool from './DataImportTool';
import ErrorBoundary from '../ui/ErrorBoundary';
import { Database } from 'lucide-react';

/**
 * Simplified AdminPage for MVP
 * Only includes the core CSV importer feature
 */
const AdminPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-gray-600">Data Import</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 mr-2 text-primary-600" />
          <h2 className="text-xl font-semibold">CSV Data Import</h2>
        </div>
        
        <ErrorBoundary>
          <DataImportTool />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AdminPage;