import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { importFromCSV } from '../../utils/dataImport/csvImporter';
import { importFromExcel } from '../../utils/dataImport/excelImporter';

type DataType = 'comprehensive' | 'cases' | 'hearings' | 'documents' | 'invoices' | 'contacts';
type ImportType = 'excel' | 'csv';

/**
 * EnhancedDataImporter
 * 
 * An improved data import component that handles both Excel and CSV files,
 * with better support for custom field mappings.
 */
const EnhancedDataImporter: React.FC = () => {
  const { dispatch } = useData();
  const [selectedDataType, setSelectedDataType] = useState<DataType>('comprehensive');
  const [importType, setImportType] = useState<ImportType>('csv');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    warnings: string[];
    stats?: {
      cases: number;
      hearings: number;
      documents: number;
      invoices: number;
      contacts: number;
    };
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(fileList);
      
      // Log the files selected for debugging
      console.log('Files selected:', fileList.map(f => f.name).join(', '));
      
      // Check if any files have unexpected extensions
      const invalidFiles = fileList.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return importType === 'excel' 
          ? !['xlsx', 'xls'].includes(ext || '')
          : ext !== 'csv';
      });
      
      if (invalidFiles.length > 0) {
        setResult({
          success: false,
          message: `Warning: Some files have unexpected extensions for ${importType} import`,
          warnings: invalidFiles.map(f => `${f.name} may not be a valid ${importType} file`)
        });
      } else {
        setResult(null);
      }
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      setResult({
        success: false,
        message: 'Please select at least one file to import',
        warnings: []
      });
      return;
    }

    try {
      setIsLoading(true);
      setProgress(10);
      setResult(null);

      // Log the import starting
      console.log(`Starting ${importType} import for data type: ${selectedDataType}`);
      console.log(`Files to process: ${files.map(f => f.name).join(', ')}`);

      // Perform the import based on the selected type
      const importResult = importType === 'excel'
        ? await importFromExcel(files)
        : await importFromCSV(files);
      
      setProgress(80);

      // Check for success
      if (importResult.success) {
        // Add the imported data to the application state
        if (importResult.entities.cases.length > 0) {
          dispatch({ type: 'ADD_CASES', payload: importResult.entities.cases });
        }
        
        if (importResult.entities.hearings.length > 0) {
          dispatch({ type: 'ADD_HEARINGS', payload: importResult.entities.hearings });
        }
        
        if (importResult.entities.documents.length > 0) {
          dispatch({ type: 'ADD_DOCUMENTS', payload: importResult.entities.documents });
        }
        
        if (importResult.entities.invoices.length > 0) {
          dispatch({ type: 'ADD_INVOICES', payload: importResult.entities.invoices });
        }
        
        if (importResult.entities.contacts.length > 0) {
          dispatch({ type: 'ADD_CONTACTS', payload: importResult.entities.contacts });
        }
        
        // Update the result status
        setResult({
          success: true,
          message: 'Import completed successfully',
          warnings: importResult.warnings,
          stats: {
            cases: importResult.entities.cases.length,
            hearings: importResult.entities.hearings.length,
            documents: importResult.entities.documents.length,
            invoices: importResult.entities.invoices.length,
            contacts: importResult.entities.contacts.length
          }
        });
      } else {
        setResult({
          success: false,
          message: 'Import failed',
          warnings: [...importResult.errors, ...importResult.warnings]
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: `Import failed: ${error}`,
        warnings: []
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Enhanced Data Import Tool</h2>
      
      {/* Data Type Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Step 1: Select Data Type</h3>
        <Select
          value={selectedDataType}
          onChange={(e) => setSelectedDataType(e.target.value as DataType)}
          className="w-full"
          disabled={isLoading}
        >
          <option value="comprehensive">Comprehensive (All Data Types)</option>
          <option value="cases">Cases Only</option>
          <option value="hearings">Hearings Only</option>
          <option value="documents">Documents Only</option>
          <option value="invoices">Invoices Only</option>
          <option value="contacts">Contacts Only</option>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Select the type of data you want to import. For multiple data types, choose "Comprehensive".
        </p>
      </div>
      
      {/* Import Format Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Step 2: Select Import Format</h3>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="csv"
              checked={importType === 'csv'}
              onChange={() => setImportType('csv')}
              className="mr-2"
              disabled={isLoading}
            />
            CSV Files
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="excel"
              checked={importType === 'excel'}
              onChange={() => setImportType('excel')}
              className="mr-2"
              disabled={isLoading}
            />
            Excel Files
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          CSV files should be comma-separated. Excel files should be in .xlsx or .xls format.
        </p>
      </div>
      
      {/* File Upload */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Step 3: Select Files to Import</h3>
        <Input
          type="file"
          multiple
          accept={importType === 'excel' ? '.xlsx,.xls' : '.csv'}
          onChange={handleFileChange}
          disabled={isLoading}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          {importType === 'excel'
            ? 'Select one or more Excel files containing your data.'
            : 'Select one or more CSV files containing your data.'}
        </p>
        
        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mt-3">
            <p className="font-medium">Selected Files:</p>
            <ul className="list-disc list-inside text-sm">
              {files.map((file, index) => (
                <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Import Button */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Step 4: Import Data</h3>
        <Button
          onClick={handleImport}
          disabled={isLoading || files.length === 0}
          className="w-full"
        >
          {isLoading ? 'Importing...' : 'Start Import'}
        </Button>
      </div>
      
      {/* Progress Bar */}
      {isLoading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-center mt-1">Processing... Please wait</p>
        </div>
      )}
      
      {/* Results */}
      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'} mb-4`}>
          <h3 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'} mb-2`}>
            {result.message}
          </h3>
          
          {/* Display stats if available */}
          {result.success && result.stats && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-sm font-medium">Cases imported:</p>
                <p className="text-xl font-bold">{result.stats.cases}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Hearings imported:</p>
                <p className="text-xl font-bold">{result.stats.hearings}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Documents imported:</p>
                <p className="text-xl font-bold">{result.stats.documents}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Invoices imported:</p>
                <p className="text-xl font-bold">{result.stats.invoices}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Contacts imported:</p>
                <p className="text-xl font-bold">{result.stats.contacts}</p>
              </div>
            </div>
          )}
          
          {/* Display warnings */}
          {result.warnings.length > 0 && (
            <div>
              <p className="font-medium text-sm">Warnings/Notes:</p>
              <ul className="list-disc list-inside text-sm">
                {result.warnings.map((warning, index) => (
                  <li key={index} className="text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Help Text */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded">
        <h4 className="font-bold mb-1">Tips for successful imports:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Make sure your CSV files use consistent column names</li>
          <li>For Excel imports, data should be on appropriately named sheets</li>
          <li>File names should indicate content (e.g., "complaints.csv", "hearings.csv")</li>
          <li>The system will attempt to map fields even if names don't exactly match</li>
          <li>Check for warnings after import to identify potential issues</li>
        </ul>
      </div>
    </Card>
  );
};

export default EnhancedDataImporter;