// DEPRECATED: replaced by DataImportTool.tsx — remove after migration
import React from 'react';
import MainLayout from '../layout/MainLayout';
import ErrorBoundary from '../ui/ErrorBoundary';
import DataImportTool from './DataImportTool';

/**
 * Data Import Page
 * 
 * A page that provides different data import tools depending on user needs:
 * - SimpleImportTool: Basic import functionality
 * - EnhancedDataImporter: Advanced import with field mapping for custom CSV formats
 */
const DataImportPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Data Import</h1>
        <ErrorBoundary>
          <DataImportTool />
        </ErrorBoundary>
      </div>
    </MainLayout>
  );
};

export default DataImportPage;