import React from 'react';
import UnifiedImportTool from './UnifiedImportTool';
import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * DataImportWrapper
 * 
 * Wrapper component for the unified import tool.
 * This provides error boundary protection and any future wrapper functionality.
 */
const DataImportWrapper: React.FC = () => {
  return (
    <ErrorBoundary>
      <UnifiedImportTool />
    </ErrorBoundary>
  );
};

export default DataImportWrapper;