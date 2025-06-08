import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SimpleImportTool from './SimpleImportTool';
import EnhancedDataImporter from './EnhancedDataImporter';
import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * DataImportWrapper
 * 
 * A streamlined version of DataImportPage without the duplicate header and layout.
 * This component only contains the tool selection and import tools.
 */
const DataImportWrapper: React.FC = () => {
  const [selectedImporter, setSelectedImporter] = useState<'simple' | 'enhanced' | null>(null);

  return (
    <>
      {/* Tool Selection */}
      {!selectedImporter && (
        <Card className="max-w-4xl mx-auto p-6">
          <h2 className="text-xl font-semibold mb-4">Select Import Method</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simple Import Tool */}
            <Card className="p-6 border hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => setSelectedImporter('simple')}>
              <h3 className="text-lg font-medium mb-2">Standard Import</h3>
              <p className="text-neutral-600 mb-4">
                Basic import tool for standard-formatted files that match our system's expected structure.
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-500 mb-4">
                <li>For simple data imports</li>
                <li>Works with standard file formats</li>
                <li>Quick and straightforward</li>
              </ul>
              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent double click event
                    setSelectedImporter('simple');
                  }}
                >
                  Use Standard Import
                </Button>
              </div>
            </Card>
            
            {/* Enhanced Import Tool */}
            <Card className="p-6 border hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => setSelectedImporter('enhanced')}>
              <h3 className="text-lg font-medium mb-2">Enhanced Import</h3>
              <p className="text-neutral-600 mb-4">
                Advanced import tool with field mapping for custom file formats and more detailed controls.
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-500 mb-4">
                <li>For custom formatted files</li>
                <li>Supports field mapping and transformation</li>
                <li>Better handling of non-standard data</li>
              </ul>
              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent double click event
                    setSelectedImporter('enhanced');
                  }}
                >
                  Use Enhanced Import
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      )}
      
      {/* Render the selected import tool */}
      {selectedImporter === 'simple' && (
        <ErrorBoundary>
          <div className="mb-4">
            <Button onClick={() => setSelectedImporter(null)} variant="outline">
              ← Back to Selection
            </Button>
          </div>
          <Card className="p-6">
            <SimpleImportTool />
          </Card>
        </ErrorBoundary>
      )}
      
      {selectedImporter === 'enhanced' && (
        <ErrorBoundary>
          <div className="mb-4">
            <Button onClick={() => setSelectedImporter(null)} variant="outline">
              ← Back to Selection
            </Button>
          </div>
          <Card className="p-6">
            <EnhancedDataImporter />
          </Card>
        </ErrorBoundary>
      )}
    </>
  );
};

export default DataImportWrapper;