import React from 'react';
import DataImportWrapper from './DataImportWrapper';

/**
 * AdminPage - Data Import functionality
 */
const AdminPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Data Import</h1>
      </div>

      <DataImportWrapper />
    </div>
  );
};

export default AdminPage;