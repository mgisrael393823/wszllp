import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Database
} from 'lucide-react';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useData } from '../../context/DataContext';
import { importFromExcel } from '../../utils/dataImport/excelImporter';
import { importFromCSV } from '../../utils/dataImport/csvImporter';
import ImportFormatGuide from './ImportFormatGuide';

// Define the data type options for import
type DataType = 
  | 'cases' 
  | 'clients' 
  | 'properties'
  | 'tenants'
  | 'hearings'
  | 'documents'
  | 'service'
  | 'invoices'
  | 'comprehensive';

interface DataTypeInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
  resource: string;
  acceptedFormats: ('excel' | 'csv')[];
  excelSheets?: string[];
  csvFileNames?: string[];
  requiredFields: string[];
}

// Information about each data type for the UI and validation
const DATA_TYPES: Record<DataType, DataTypeInfo> = {
  cases: {
    label: 'Eviction Cases',
    description: 'Case filings, court status, and essential case data',
    icon: <Database className="w-5 h-5" />,
    resource: 'cases',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['Complaint', 'ALL EVICTIONS FILES'],
    csvFileNames: ['complaints.csv', 'all-evictions.csv'],
    requiredFields: ['plaintiff', 'defendant', 'address', 'file id']
  },
  clients: {
    label: 'Clients & Contacts',
    description: 'Property managers, attorneys, and other contacts',
    icon: <Database className="w-5 h-5" />,
    resource: 'contacts',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['PM INFO'],
    csvFileNames: ['pm-info.csv', 'clients.csv', 'contacts.csv'],
    requiredFields: ['name', 'role', 'email', 'phone']
  },
  properties: {
    label: 'Properties',
    description: 'Property details, addresses, and ownership information',
    icon: <Database className="w-5 h-5" />,
    resource: 'properties',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['Properties'],
    csvFileNames: ['properties.csv', 'addresses.csv'],
    requiredFields: ['address', 'client', 'property_id']
  },
  tenants: {
    label: 'Tenants',
    description: 'Defendants and additional tenant information',
    icon: <Database className="w-5 h-5" />,
    resource: 'tenants',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['Tenants'],
    csvFileNames: ['tenants.csv', 'defendants.csv'],
    requiredFields: ['name', 'case_id', 'phone']
  },
  hearings: {
    label: 'Court Proceedings',
    description: 'Hearings, court dates, judgments, and outcomes',
    icon: <Database className="w-5 h-5" />,
    resource: 'hearings',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['Court 25', 'Court 24', 'ZOOM'],
    csvFileNames: ['court-25.csv', 'court-24.csv', 'zoom.csv'],
    requiredFields: ['file id', 'date', 'time', 'court']
  },
  documents: {
    label: 'Legal Documents',
    description: 'Complaints, summons, and other legal filings',
    icon: <Database className="w-5 h-5" />,
    resource: 'documents',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['Summons', 'ALIAS Summons', 'Aff of Serv'],
    csvFileNames: ['summons.csv', 'alias-summons.csv', 'affidavits.csv'],
    requiredFields: ['file id', 'type', 'status']
  },
  service: {
    label: 'Service Attempts',
    description: 'Process service tracking and outcomes',
    icon: <Database className="w-5 h-5" />,
    resource: 'serviceLogs',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['SPS 25', 'SPS & ALIAS', 'SHERIFF', 'SHERIFF EVICTIONS'],
    csvFileNames: ['sps-25.csv', 'sheriff.csv', 'service.csv'],
    requiredFields: ['file id', 'date', 'method', 'result']
  },
  invoices: {
    label: 'Financial Records',
    description: 'Invoices, payments, and payment plans',
    icon: <Database className="w-5 h-5" />,
    resource: 'invoices',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: ['Outstanding Invoices', 'New Invoice List', 'Final Invoices', 'Payment Plan'],
    csvFileNames: ['outstanding-invoices.csv', 'new-invoices.csv', 'final-invoices.csv', 'payment-plan.csv'],
    requiredFields: ['file id', 'amount', 'date']
  },
  comprehensive: {
    label: 'All Data (Comprehensive)',
    description: 'Complete data import with all entity types',
    icon: <Database className="w-5 h-5" />,
    resource: 'comprehensive',
    acceptedFormats: ['excel', 'csv'],
    excelSheets: [
      'Complaint', 'ALL EVICTIONS FILES', 'Court 25', 'Court 24', 'ZOOM',
      'Summons', 'ALIAS Summons', 'Aff of Serv', 'SPS 25', 'SPS & ALIAS',
      'SHERIFF', 'SHERIFF EVICTIONS', 'Outstanding Invoices', 'New Invoice List',
      'Final Invoices', 'Payment Plan', 'PM INFO'
    ],
    csvFileNames: [
      'complaints.csv', 'all-evictions.csv', 'court-25.csv', 'court-24.csv',
      'zoom.csv', 'summons.csv', 'alias-summons.csv', 'affidavits.csv',
      'sps-25.csv', 'sheriff.csv', 'outstanding-invoices.csv', 'payment-plan.csv',
      'pm-info.csv'
    ],
    requiredFields: [] // For comprehensive, we don't have specific requirements
  }
};

// Main component for a simple import tool that doesn't use Refine
const SimpleImportTool: React.FC = () => {
  const { dispatch } = useData();
  const [selectedDataType, setSelectedDataType] = useState<DataType>('comprehensive');
  const [importType, setImportType] = useState<'excel' | 'csv'>('excel');
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get the data type info for the current selection
  const dataTypeInfo = DATA_TYPES[selectedDataType];
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        console.log("Files selected:", e.target.files);
        
        // Convert FileList to array
        const filesArray = importType === 'csv' && e.target.files.length > 1 
          ? Array.from(e.target.files) 
          : [e.target.files[0]];
          
        setSelectedFiles(filesArray);
        setErrorMessage(null);
        console.log("Files set:", filesArray);
      }
    } catch (error) {
      console.error("Error processing file selection:", error);
      setErrorMessage(`Error selecting file: ${error}`);
    }
  };
  
  // Handle import
  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage("Please select a file first.");
      return;
    }
    
    setIsImporting(true);
    setImportStatus('loading');
    
    try {
      console.log("Starting import with files:", selectedFiles);
      
      let result;
      
      if (importType === 'excel') {
        // Use the first file for Excel, but wrap it in an array as expected by the function
        result = await importFromExcel([selectedFiles[0]]);
      } else {
        // Use all files for CSV
        result = await importFromCSV(selectedFiles);
      }
      
      setImportResult(result);
      
      if (result.success) {
        console.log("Import successful:", result);
        
        // For comprehensive imports, we load all entity types
        if (selectedDataType === 'comprehensive') {
          dispatch({
            type: 'LOAD_DATA',
            payload: {
              cases: result.entities.cases,
              hearings: result.entities.hearings,
              documents: result.entities.documents,
              serviceLogs: result.entities.serviceLogs,
              invoices: result.entities.invoices,
              paymentPlans: result.entities.paymentPlans,
              contacts: result.entities.contacts,
              zoomLinks: [], // Not directly imported
              workflows: [], // Not directly imported
              workflowTasks: [], // Not directly imported
              documentTemplates: [], // Not directly imported
              documentGenerations: [], // Not directly imported
              calendarEvents: [], // Not directly imported
              calendarIntegrations: [], // Not directly imported
              notifications: [], // Not directly imported
              notificationSettings: {
                hearingReminders: true,
                deadlineReminders: true,
                documentUpdates: true,
                workflowUpdates: true,
                systemAnnouncements: true,
                emailNotifications: false,
                advanceHearingReminder: 24,
                advanceDeadlineReminder: 48,
              },
              auditLogs: [] // New audit logs will be generated during import
            }
          });
        } else {
          // For specific entity types, we only update that type
          // First get the entities for the current type
          const entities = result.entities[dataTypeInfo.resource] || [];
          
          if (entities.length === 0) {
            setErrorMessage(`No ${dataTypeInfo.resource} found in the imported data.`);
            setImportStatus('error');
            setIsImporting(false);
            return;
          }
          
          // Convert to appropriate dispatch action
          const resourceMap: Record<string, string> = {
            'cases': 'ADD_CASE',
            'contacts': 'ADD_CONTACT',
            'hearings': 'ADD_HEARING',
            'documents': 'ADD_DOCUMENT',
            'serviceLogs': 'ADD_SERVICE_LOG',
            'invoices': 'ADD_INVOICE',
            'paymentPlans': 'ADD_PAYMENT_PLAN'
          };
          
          const actionType = resourceMap[dataTypeInfo.resource];
          
          if (actionType) {
            // Add each entity individually
            entities.forEach((entity: any) => {
              dispatch({
                type: actionType,
                payload: entity
              });
            });
          }
        }
        
        setImportStatus('success');
      } else {
        setErrorMessage(result.errors?.join(', ') || 'Import failed');
        setImportStatus('error');
      }
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(`Import failed: ${error}`);
      setImportStatus('error');
    } finally {
      setIsImporting(false);
    }
  };
  
  // Reset import state
  const handleReset = () => {
    setSelectedFiles([]);
    setImportStatus('idle');
    setImportResult(null);
    setErrorMessage(null);
    
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800">Enhanced Data Import Tool</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFormatGuide(true)}
            >
              <Info className="w-4 h-4 mr-1" />
              Import Guide
            </Button>
            {importStatus !== 'idle' && (
              <Button variant="outline" onClick={handleReset} size="sm">
                Start Over
              </Button>
            )}
          </div>
        </div>
        
        {/* Import status messages */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-md border border-error-200 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}
        
        {importStatus === 'success' && (
          <div className="mb-6 p-4 bg-success-50 text-success-700 rounded-md border border-success-200 flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Import completed successfully!</p>
              <p className="text-sm mt-1">
                {importResult && (
                  <>
                    Imported {importResult.entities.cases?.length || 0} cases, 
                    {importResult.entities.hearings?.length || 0} hearings, 
                    {importResult.entities.documents?.length || 0} documents, 
                    {importResult.entities.contacts?.length || 0} contacts, 
                    and more.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
        
        {/* Step 1: Select data type */}
        {importStatus === 'idle' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-3">Step 1: Select Data Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(DATA_TYPES).map(([key, info]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedDataType === key 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                    }`}
                    onClick={() => setSelectedDataType(key as DataType)}
                  >
                    <div className="flex items-center space-x-3">
                      {info.icon}
                      <div>
                        <h4 className="font-medium text-neutral-800">{info.label}</h4>
                        <p className="text-xs text-neutral-500">{info.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Step 2: Select import format */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-3">Step 2: Select Format</h3>
              <div className="flex space-x-4">
                <div 
                  className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                    importType === 'excel' 
                      ? 'bg-primary-50 text-primary-600 border border-primary-200' 
                      : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                  onClick={() => setImportType('excel')}
                  role="radio"
                  aria-checked={importType === 'excel'}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setImportType('excel');
                    }
                  }}
                >
                  <FileSpreadsheet className="w-5 h-5 mr-2" aria-hidden="true" />
                  Excel Import (.xlsx)
                </div>
                
                <div 
                  className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                    importType === 'csv' 
                      ? 'bg-primary-50 text-primary-600 border border-primary-200' 
                      : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                  onClick={() => setImportType('csv')}
                  role="radio"
                  aria-checked={importType === 'csv'}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setImportType('csv');
                    }
                  }}
                >
                  <FileText className="w-5 h-5 mr-2" aria-hidden="true" />
                  CSV Import (.csv)
                </div>
              </div>
            </div>
            
            {/* Step 3: Upload file */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-3">Step 3: Upload File</h3>
              <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                <div className="mt-4 flex text-sm justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                  >
                    <span>
                      {importType === 'excel' 
                        ? 'Upload Excel file' 
                        : 'Upload CSV file(s)'
                      }
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept={importType === 'excel' ? '.xlsx' : '.csv'}
                      onChange={handleFileChange}
                      multiple={importType === 'csv'}
                    />
                  </label>
                  <p className="pl-1 text-neutral-500">or drag and drop</p>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  {importType === 'excel' 
                    ? `Excel file (.xlsx) containing ${selectedDataType === 'comprehensive' ? 'all data' : selectedDataType} data` 
                    : `CSV file${importType === 'csv' ? '(s)' : ''} containing ${selectedDataType === 'comprehensive' ? 'all data' : selectedDataType} data`
                  }
                </p>
                
                {/* Show selected files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 bg-neutral-50 p-3 rounded-md text-left">
                    <p className="font-medium text-neutral-700 mb-1">Selected Files:</p>
                    <ul className="text-sm text-neutral-600">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="flex items-center">
                          {importType === 'excel' ? (
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-neutral-500" />
                          ) : (
                            <FileText className="w-4 h-4 mr-2 text-neutral-500" />
                          )}
                          {file.name} ({Math.round(file.size / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Show format guidance based on selected data type */}
                <div className="mt-4 text-xs text-neutral-500">
                  {dataTypeInfo.acceptedFormats.includes(importType) ? (
                    <div className="bg-blue-50 p-3 rounded text-left inline-block">
                      <p className="font-medium text-blue-700 mb-1">
                        {importType === 'excel' ? 'Expected Excel Sheets:' : 'Expected CSV Files:'}
                      </p>
                      <ul className="list-disc pl-5 text-blue-600 space-y-1">
                        {importType === 'excel' && dataTypeInfo.excelSheets?.map(sheet => (
                          <li key={sheet}>{sheet}</li>
                        ))}
                        {importType === 'csv' && dataTypeInfo.csvFileNames?.map(fileName => (
                          <li key={fileName}>{fileName}</li>
                        ))}
                      </ul>
                      <p className="font-medium text-blue-700 mt-2 mb-1">Required Fields:</p>
                      <p className="text-blue-600">
                        {dataTypeInfo.requiredFields.join(', ') || 'Depends on file type'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-error-600">
                      {importType === 'excel' ? 'Excel format' : 'CSV format'} is not supported for {dataTypeInfo.label}. 
                      Please choose a different format or data type.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleImport} 
                disabled={isImporting || selectedFiles.length === 0}
              >
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {importStatus === 'loading' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-700">Importing data...</p>
            <p className="text-sm text-neutral-500 mt-2">
              This may take a few moments
            </p>
          </div>
        )}
        
        {/* Import guide modal */}
        <ImportFormatGuide 
          isOpen={showFormatGuide} 
          onClose={() => setShowFormatGuide(false)}
          importType={importType}
        />
      </Card>
    </div>
  );
};

export default SimpleImportTool;