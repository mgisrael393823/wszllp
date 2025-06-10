import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../ui/shadcn-card';
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
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [mappingType, setMappingType] = useState<string>('');
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(fileList);
      setPreviewData([]);
      setFileHeaders([]);
      setShowMapping(false);
      
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
        
        // For CSV files, try to preview the first file to enable column mapping
        if (importType === 'csv' && fileList.length > 0) {
          try {
            const firstFile = fileList[0];
            const content = await readFileAsText(firstFile);
            
            // Simple CSV parsing for preview
            const lines = content.split('\n');
            if (lines.length > 0) {
              const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
              setFileHeaders(headers);
              
              // Determine the likely mapping type based on headers
              let detectedType = 'unknown';
              
              if (headers.some(h => h.startsWith('unnamed_'))) {
                detectedType = 'all_evictions';
              } else if (headers.some(h => h.toLowerCase().includes('complaint') || h.toLowerCase().includes('plaintiff'))) {
                detectedType = 'complaint';
              } else if (headers.some(h => h.toLowerCase().includes('court') || h.toLowerCase().includes('hearing'))) {
                detectedType = 'hearing';
              }
              
              setMappingType(detectedType);
              
              // Preview up to 5 rows of data
              if (lines.length > 1) {
                const previewRows = [];
                for (let i = 1; i < Math.min(lines.length, 6); i++) {
                  if (lines[i].trim()) {
                    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    const row: Record<string, string> = {};
                    headers.forEach((header, index) => {
                      row[header] = cells[index] || '';
                    });
                    previewRows.push(row);
                  }
                }
                setPreviewData(previewRows);
                
                // Show mapping interface if we have headers with unnamed columns
                if (headers.some(h => h.startsWith('unnamed_'))) {
                  setShowMapping(true);
                  // Initialize mappings
                  const initialMappings: Record<string, string> = {};
                  headers.forEach(header => {
                    initialMappings[header] = header;
                  });
                  setFieldMappings(initialMappings);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing CSV for preview:', error);
          }
        }
      }
    }
  };
  
  // Helper function to read file content
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };
  
  // Handle field mapping change
  const handleMappingChange = (sourceField: string, targetField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [sourceField]: targetField
    }));
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
      // Ensure files is always an array even when using Excel import
      const importResult = importType === 'excel'
        ? await importFromExcel(Array.isArray(files) ? files : [files[0]])
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
          onChange={(value) => setSelectedDataType(value as DataType)}
          className="w-full"
          disabled={isLoading}
          options={[
            { value: "comprehensive", label: "Comprehensive (All Data Types)" },
            { value: "cases", label: "Cases Only" },
            { value: "hearings", label: "Hearings Only" },
            { value: "documents", label: "Documents Only" },
            { value: "invoices", label: "Invoices Only" },
            { value: "contacts", label: "Contacts Only" }
          ]}
        />
        <p className="text-sm text-neutral-500 mt-1">
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
        <p className="text-sm text-neutral-500 mt-1">
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
        <p className="text-sm text-neutral-500 mt-1">
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
        
        {/* Column Mapping Interface */}
        {showMapping && fileHeaders.length > 0 && (
          <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-medium text-lg mb-3">Column Mapping</h4>
            <p className="text-sm text-blue-700 mb-3">
              We detected columns that need mapping. Please specify what each column represents:
            </p>
            
            {mappingType === 'all_evictions' && (
              <div className="mb-3 bg-yellow-50 p-2 rounded border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  <strong>File Type Detected:</strong> All Evictions Files CSV
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2">
              {fileHeaders.map((header) => (
                <div key={header} className="flex items-center space-x-2">
                  <div className="w-1/2 text-sm truncate">
                    {header}:
                  </div>
                  <Select
                    value={fieldMappings[header] || ''}
                    onChange={(value) => handleMappingChange(header, value)}
                    className="w-1/2 text-sm"
                    options={[
                      { value: "", label: "Not Used" },
                      { value: "File #", label: "Case ID" },
                      { value: "Plaintiff 1", label: "Plaintiff/Owner" },
                      { value: "Defendant 1", label: "Defendant/Tenant" },
                      { value: "Property Address", label: "Property Address" },
                      { value: "Case Name", label: "Case Name" },
                      { value: "Court Date", label: "Court Date" },
                      { value: "Filing Date", label: "Filing Date" },
                      { value: "Status", label: "Case Status" },
                      { value: "Cost Fronted", label: "Cost Fronted" },
                      { value: "Total Costs", label: "Total Costs" },
                      { value: "Attorney Fee", label: "Attorney Fee" },
                      { value: "Total Owed", label: "Total Owed" }
                    ]}
                  />
                </div>
              ))}
            </div>
            
            {/* Data Preview */}
            {previewData.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Data Preview</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead>
                      <tr className="bg-neutral-50">
                        {fileHeaders.slice(0, 6).map((header) => (
                          <th key={header} className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                        {fileHeaders.length > 6 && (
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                          {fileHeaders.slice(0, 6).map((header) => (
                            <td key={`${idx}-${header}`} className="px-3 py-2 text-xs text-neutral-500 truncate max-w-xs">
                              {row[header] || '-'}
                            </td>
                          ))}
                          {fileHeaders.length > 6 && (
                            <td className="px-3 py-2 text-xs text-neutral-500">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Showing {previewData.length} rows of preview data
                </p>
              </div>
            )}
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
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
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
      <div className="mt-6 text-sm text-neutral-600 bg-neutral-50 p-4 rounded">
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