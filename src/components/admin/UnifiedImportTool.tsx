import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Database,
  Users,
  Calendar,
  DollarSign,
  FileX,
  HelpCircle,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { importFromExcel } from '../../utils/dataImport/excelImporter';
import { importFromCSV } from '../../utils/dataImport/csvImporter';
import { routeImport } from '../../utils/dataImport/importRouter';
import { saveAllEntitiesToSupabase } from '../../utils/dataImport/databaseOperations';
import { useData } from '../../context/DataContext';
import CSVDataInspector from './CSVDataInspector';
import ImportFormatGuide from './ImportFormatGuide';

// Types
type ImportStep = 'type' | 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';
type DataType = 'auto' | 'contact' | 'case' | 'hearing' | 'invoice' | 'document' | 'comprehensive';
type ImportFormat = 'excel' | 'csv';

interface ImportProgress {
  step: ImportStep;
  progress: number;
  message: string;
}

interface ImportStats {
  cases: number;
  contacts: number;
  hearings: number;
  documents: number;
  invoices: number;
  serviceLogs: number;
}

interface ImportResult {
  success: boolean;
  entities: {
    cases: any[];
    contacts: any[];
    hearings: any[];
    documents: any[];
    invoices: any[];
    serviceLogs: any[];
  };
  stats: ImportStats;
  warnings: string[];
  errors: string[];
}

/**
 * UnifiedImportTool - Consolidated import solution combining the best features
 * from all existing import tools
 */
const UnifiedImportTool: React.FC = () => {
  const { dispatch } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [dataType, setDataType] = useState<DataType>('auto');
  const [importFormat, setImportFormat] = useState<ImportFormat>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mappedData, setMappedData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    step: 'type',
    progress: 0,
    message: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [showCsvInspector, setShowCsvInspector] = useState(false);

  // Data type configurations
  const dataTypeConfigs = {
    contact: {
      label: 'Contacts',
      icon: Users,
      description: 'Client information, attorneys, and other contacts',
      color: 'blue'
    },
    case: {
      label: 'Cases',
      icon: FileText,
      description: 'Legal cases with plaintiffs and defendants',
      color: 'purple'
    },
    hearing: {
      label: 'Hearings',
      icon: Calendar,
      description: 'Court dates and hearing information',
      color: 'green'
    },
    invoice: {
      label: 'Invoices',
      icon: DollarSign,
      description: 'Billing and payment records',
      color: 'amber'
    },
    document: {
      label: 'Documents',
      icon: FileX,
      description: 'Legal documents and files',
      color: 'red'
    },
    comprehensive: {
      label: 'Comprehensive',
      icon: Database,
      description: 'Multi-sheet Excel with all data types',
      color: 'indigo'
    },
    auto: {
      label: 'Auto-Detect',
      icon: Database,
      description: 'Let the system determine data type',
      color: 'gray'
    }
  };

  // Step navigation
  const goToStep = (step: ImportStep) => {
    setCurrentStep(step);
    setProgress(prev => ({ ...prev, step }));
  };

  const goBack = () => {
    switch (currentStep) {
      case 'mapping':
        goToStep('upload');
        setShowCsvInspector(false);
        break;
      case 'preview':
        if (importFormat === 'csv') {
          goToStep('mapping');
        } else {
          goToStep('upload');
        }
        break;
      default:
        break;
    }
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      
      // Auto-proceed for CSV to show mapping interface
      if (importFormat === 'csv') {
        setShowCsvInspector(true);
        goToStep('mapping');
      }
    }
  };

  // CSV mapping complete handler
  const handleCsvMappingComplete = useCallback((mappedData: any, fileType: string) => {
    setMappedData(mappedData);
    setShowCsvInspector(false);
    
    // Update data type if auto-detected
    if (dataType === 'auto' && fileType) {
      setDataType(fileType as DataType);
    }
    
    // Process the mapped data
    processImportData(mappedData);
  }, [dataType]);

  // Process import data (from CSV mapping or Excel)
  const processImportData = async (data: any[]) => {
    try {
      setProgress({ step: 'preview', progress: 50, message: 'Processing data...' });
      
      // Route the data based on type
      const result = routeImport(dataType === 'auto' ? 'comprehensive' : dataType, data);
      
      if (result.success) {
        setImportResult(result);
        goToStep('preview');
      } else {
        throw new Error('Failed to process import data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process import');
      setProgress({ step: currentStep, progress: 0, message: '' });
    }
  };

  // Handle Excel import
  const handleExcelImport = async () => {
    if (!selectedFile) return;

    try {
      setProgress({ step: 'upload', progress: 25, message: 'Reading Excel file...' });
      
      const result = await importFromExcel(selectedFile);
      
      if (result.success && result.entities) {
        setImportResult(result);
        goToStep('preview');
      } else {
        throw new Error(result.errors?.join(', ') || 'Failed to import Excel file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Excel file');
      setProgress({ step: 'upload', progress: 0, message: '' });
    }
  };

  // Execute the import
  const executeImport = async () => {
    if (!importResult) return;

    goToStep('importing');
    setProgress({ step: 'importing', progress: 0, message: 'Starting import...' });

    try {
      // Save to Supabase
      setProgress({ step: 'importing', progress: 30, message: 'Saving to database...' });
      const saveResults = await saveAllEntitiesToSupabase(importResult.entities);
      
      // Check for errors
      const errors = Object.entries(saveResults)
        .filter(([_, result]) => !result.success)
        .flatMap(([type, result]) => result.errors?.map(e => `${type}: ${e}`) || []);
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Update local state
      setProgress({ step: 'importing', progress: 70, message: 'Updating local data...' });
      
      // Dispatch bulk actions for each entity type
      if (importResult.entities.cases.length > 0) {
        const enhancedCases = importResult.entities.cases.map(c => ({ 
          ...c, 
          caseId: c.caseId || c.id || uuidv4() 
        }));
        dispatch({ type: 'ADD_CASES', payload: enhancedCases });
      }

      if (importResult.entities.contacts.length > 0) {
        const enhancedContacts = importResult.entities.contacts.map(c => ({ 
          ...c, 
          contactId: c.contactId || c.id || uuidv4() 
        }));
        dispatch({ type: 'ADD_CONTACTS', payload: enhancedContacts });
      }

      if (importResult.entities.hearings.length > 0) {
        const enhancedHearings = importResult.entities.hearings.map(h => ({ 
          ...h, 
          hearingId: h.hearingId || h.id || uuidv4() 
        }));
        dispatch({ type: 'ADD_HEARINGS', payload: enhancedHearings });
      }

      if (importResult.entities.documents.length > 0) {
        const enhancedDocuments = importResult.entities.documents.map(d => ({ 
          ...d, 
          docId: d.docId || d.id || uuidv4() 
        }));
        dispatch({ type: 'ADD_DOCUMENTS', payload: enhancedDocuments });
      }

      if (importResult.entities.invoices.length > 0) {
        const enhancedInvoices = importResult.entities.invoices.map(i => ({ 
          ...i, 
          invoiceId: i.invoiceId || i.id || uuidv4() 
        }));
        dispatch({ type: 'ADD_INVOICES', payload: enhancedInvoices });
      }

      // Note: serviceLogs are handled separately as they don't have a bulk action yet

      setProgress({ step: 'complete', progress: 100, message: 'Import completed successfully!' });
      goToStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete import');
      setProgress({ step: 'importing', progress: 0, message: '' });
      goToStep('preview');
    }
  };

  // Reset the import process
  const reset = () => {
    setCurrentStep('upload');
    setDataType('auto');
    setImportFormat('csv');
    setSelectedFile(null);
    setMappedData([]);
    setImportResult(null);
    setProgress({ step: 'upload', progress: 0, message: '' });
    setError(null);
    setShowCsvInspector(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Upload File' },
      ...(importFormat === 'csv' ? [{ key: 'mapping', label: 'Map Columns' }] : []),
      { key: 'preview', label: 'Preview' },
      { key: 'importing', label: 'Import' },
      { key: 'complete', label: 'Complete' }
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className={`flex items-center ${index <= currentIndex ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentIndex ? 'bg-primary-600 text-white' : 
                  index === currentIndex ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {index < currentIndex ? '✓' : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {currentStep !== 'upload' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="mr-3"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-2xl font-semibold">Import Data</h2>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFormatGuide(true)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Format Guide
            </Button>
            <Button variant="outline" onClick={reset} size="sm">
              Start Over
            </Button>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Choose import format</h3>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setImportFormat('csv')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    importFormat === 'csv'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">CSV Import</div>
                  <div className="text-xs mt-1">Map columns to fields</div>
                </button>
                <button
                  onClick={() => setImportFormat('excel')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    importFormat === 'excel'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">Excel Import</div>
                  <div className="text-xs mt-1">Multi-sheet support</div>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <Select
                label="Data Type (optional - will auto-detect if not specified)"
                value={dataType}
                onChange={(value) => setDataType(value as DataType)}
                options={[
                  { value: 'auto', label: 'Auto-detect from file content' },
                  { value: 'contact', label: 'Contacts - Client and party information' },
                  { value: 'case', label: 'Cases - Legal case records' },
                  { value: 'hearing', label: 'Hearings - Court dates and outcomes' },
                  { value: 'invoice', label: 'Invoices - Billing and payment records' },
                  { value: 'document', label: 'Documents - Legal documents and files' },
                  { value: 'comprehensive', label: 'Comprehensive - Multi-sheet Excel with all data types' }
                ]}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                >
                  <span>Upload {importFormat === 'excel' ? 'Excel' : 'CSV'} file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept={importFormat === 'excel' ? '.xlsx' : '.csv'}
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                  />
                </label>
                <p className="pl-1 text-gray-500">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {importFormat === 'excel' 
                  ? 'Excel file (.xlsx) with your data'
                  : 'CSV file (.csv) - you\'ll be able to map columns next'
                }
              </p>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {importFormat === 'excel' && (
                    <Button 
                      variant="primary" 
                      onClick={handleExcelImport}
                    >
                      Process Excel File
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSV Inspector Modal */}
        {showCsvInspector && selectedFile && (
          <CSVDataInspector
            file={selectedFile}
            onClose={() => {
              setShowCsvInspector(false);
              goToStep('upload');
            }}
            onImport={handleCsvMappingComplete}
          />
        )}

        {currentStep === 'preview' && importResult && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Import Preview</h3>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(importResult.stats).map(([key, value]) => {
                if (value === 0) return null;
                const config = dataTypeConfigs[key as keyof typeof dataTypeConfigs] || {
                  icon: Database,
                  label: key,
                  color: 'gray'
                };
                const Icon = config.icon;
                
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon className={`w-8 h-8 text-${config.color}-600 mr-3`} />
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-600">{config.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warnings */}
            {importResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Warnings ({importResult.warnings.length})
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {importResult.warnings.slice(0, 5).map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                  {importResult.warnings.length > 5 && (
                    <li className="font-medium">
                      ... and {importResult.warnings.length - 5} more warnings
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={goBack}>
                Back to Mapping
              </Button>
              <Button 
                variant="primary" 
                onClick={executeImport}
                disabled={Object.values(importResult.stats).every(v => v === 0)}
              >
                Import Data
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'importing' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-900">Importing data...</p>
            <p className="text-sm text-gray-600 mt-2">{progress.message}</p>
            <div className="mt-4 max-w-xs mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Import Complete!</h3>
            <p className="text-gray-600">
              Your data has been successfully imported and saved.
            </p>
            <div className="pt-4">
              <Button variant="primary" onClick={reset}>
                Import More Data
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Format Guide Modal */}
      <ImportFormatGuide 
        isOpen={showFormatGuide} 
        onClose={() => setShowFormatGuide(false)}
        importType={importFormat}
      />
    </div>
  );
};

export default UnifiedImportTool;