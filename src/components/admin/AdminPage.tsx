import React from 'react';
import DataImportTool from './DataImportTool';
import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * Simplified AdminPage for MVP
 * Only includes the core CSV importer feature
 */
const AdminPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
      </div>

      <ErrorBoundary>
        <DataImportTool />
      </ErrorBoundary>
    </div>
  );
};

export default AdminPage;