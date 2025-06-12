import React from 'react';
import DataImportWrapper from './DataImportWrapper';

/**
 * Data Import Page
 * Allows users to import legal data from Excel or CSV files
 */
const AdminPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Import</h1>
          <p className="page-subtitle">Import cases, contacts, hearings, and invoices from spreadsheets</p>
        </div>
      </div>

      <DataImportWrapper />
    </div>
  );
};

export default AdminPage;