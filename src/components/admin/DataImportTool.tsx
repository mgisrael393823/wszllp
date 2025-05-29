import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { importFromExcel } from '../../utils/dataImport/excelImporter';
import { importFromCSV } from '../../utils/dataImport/csvImporter';
import { routeImport } from '../../utils/dataImport/importRouter';
import CSVDataInspector from './CSVDataInspector';
import { useData } from '../../context/DataContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ImportFormatGuide from './ImportFormatGuide';
import { Upload, CheckCircle, AlertCircle, FileText, Database, FileSpreadsheet, HelpCircle } from 'lucide-react';

const DataImportTool: React.FC = () => {
  const { dispatch } = useData();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete' | 'csvInspector'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'excel' | 'csv'>('excel');
  const [dataType, setDataType] = useState<'auto' | 'contact' | 'case' | 'hearing' | 'invoice' | 'document'>('auto');
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles([e.target.files[0]]);
      setError(null);
    }
  };
  
  const handleImportTypeChange = (type: 'excel' | 'csv') => {
    setImportType(type);
    setSelectedFiles([]);
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select file(s) to import');
      return;
    }

    // Validate file types
    if (importType === 'excel' && !selectedFiles[0].name.endsWith('.xlsx')) {
      setError('Please upload an Excel file (.xlsx)');
      return;
    }

    setError(null);
    
    try {
      if (importType === 'excel') {
        setStep('preview');
        setIsImporting(true);
        const result = await importFromExcel(selectedFiles);
        setImportResult(result);
        setIsImporting(false);
        
        if (result.success) {
          setStep('preview');
        } else {
          setError('Import failed. Please check the file format and try again.');
          setStep('upload');
        }
      } else {
        // For CSV, show the inspector first 
        setSelectedCsvFile(selectedFiles[0]);
        setStep('csvInspector');
      }
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : String(err)}`);
      setIsImporting(false);
      setStep('upload');
    }
  };

  const handleCsvImportComplete = async (mappedData: any, fileType: string) => {
    setIsImporting(true);

    try {
      const effectiveDataType = dataType === 'auto' ? fileType : dataType;

      const result = routeImport(effectiveDataType, mappedData);

      console.log('Using mapped data:', mappedData);
      setImportResult(result);
      
      if (mappedData && mappedData.length > 0) {
        setStep('preview');
      } else {
        setError('No data was mapped. Please check your column mappings.');
        setStep('csvInspector');
      }
    } catch (err) {
      setError(`CSV import error: ${err instanceof Error ? err.message : String(err)}`);
      setStep('upload');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!importResult) return;

    setIsImporting(true);
    setStep('importing');

    try {
      // Import data into the application
      const { entities } = importResult;

      console.log('Importing data:', {
        cases: entities.cases.length, 
        hearings: entities.hearings.length,
        documents: entities.documents.length,
        serviceLogs: entities.serviceLogs.length,
        invoices: entities.invoices.length,
        paymentPlans: entities.paymentPlans.length,
        contacts: entities.contacts.length
      });

      // Check if we have any data to display
      if (entities.cases.length === 0) {
        console.log('No cases found in import');
      }
      
      // Validate and enhance imported cases data
      const enhancedCases = entities.cases.map(caseItem => {
        // Ensure each case has required fields
        return {
          ...caseItem,
          // Generate required fields if they don't exist
          caseId: caseItem.caseId || caseItem.id || `case-${Math.random().toString(36).substring(2, 11)}`,
          id: caseItem.id || caseItem.caseId || `case-${Math.random().toString(36).substring(2, 11)}`,
          title: caseItem.title || caseItem.caseName || caseItem.name || 'Untitled Case',
          status: caseItem.status || 'Open',
          createdAt: caseItem.createdAt || new Date().toISOString(),
          updatedAt: caseItem.updatedAt || new Date().toISOString()
        };
      });

      // Validate and enhance imported contacts data
      const enhancedContacts = entities.contacts.map(contactItem => {
        // Ensure each contact has required fields
        return {
          ...contactItem,
          // Generate required fields if they don't exist
          contactId: contactItem.contactId || contactItem.id || `contact-${Math.random().toString(36).substring(2, 11)}`,
          id: contactItem.id || contactItem.contactId || `contact-${Math.random().toString(36).substring(2, 11)}`,
          name: contactItem.name || 'Unknown Contact',
          role: contactItem.role || 'Other',
          email: contactItem.email || '',
          phone: contactItem.phone || '',
          createdAt: contactItem.createdAt || new Date().toISOString(),
          updatedAt: contactItem.updatedAt || new Date().toISOString()
        };
      });

      console.log('Enhanced contacts:', enhancedContacts);

      // Load all the data in a single dispatch
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          cases: enhancedCases,
          hearings: entities.hearings,
          documents: entities.documents,
          serviceLogs: entities.serviceLogs,
          invoices: entities.invoices,
          paymentPlans: entities.paymentPlans,
          contacts: enhancedContacts,
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
      
      // Add an audit log entry
      const totalImported = enhancedCases.length + enhancedContacts.length + entities.hearings.length + entities.documents.length + entities.invoices.length;
      const importDetails = [];
      if (enhancedCases.length > 0) importDetails.push(`${enhancedCases.length} cases`);
      if (enhancedContacts.length > 0) importDetails.push(`${enhancedContacts.length} contacts`);
      if (entities.hearings.length > 0) importDetails.push(`${entities.hearings.length} hearings`);
      if (entities.documents.length > 0) importDetails.push(`${entities.documents.length} documents`);
      if (entities.invoices.length > 0) importDetails.push(`${entities.invoices.length} invoices`);
      
      dispatch({
        type: 'ADD_AUDIT_LOG',
        payload: {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          action: 'IMPORT_DATA',
          entityType: 'MIXED',
          entityId: 'BULK_IMPORT',
          userId: 'CURRENT_USER', // In a real app, this would be the current user's ID
          details: `Imported ${importDetails.join(', ')}`,
          changes: { added: totalImported }
        }
      });
      
      // Log success message
      console.log('Data import completed successfully!');

      setStep('complete');
    } catch (err) {
      setError(`Error applying import: ${err instanceof Error ? err.message : String(err)}`);
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setImportResult(null);
    setStep('upload');
    setError(null);
    setSelectedCsvFile(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Data Import Tool</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFormatGuide(true)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Format Guide
            </Button>
            {step !== 'upload' && (
              <Button variant="outline" onClick={handleReset} size="sm">
                Start Over
              </Button>
            )}
          </div>
        </div>
        
        {showFormatHelp && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            <h3 className="font-medium mb-2">CSV Import Format Requirements</h3>
            <ul className="list-disc ml-4 space-y-1 text-sm">
              <li>Files must be named to indicate their content (e.g., "complaints.csv")</li>
              <li>First row must contain column headers</li>
              <li>Data must be comma-separated (CSV)</li>
              <li>Required file categories:
                <ul className="list-disc ml-4 mt-1">
                  <li>Cases: "complaints.csv" or "all-evictions.csv"</li>
                  <li>Hearings: "court-25.csv" and/or "court-24.csv"</li>
                  <li>Optional: "zoom.csv" for Zoom links</li>
                  <li>Optional: "pm-info.csv" or "clients.csv" for contact information</li>
                </ul>
              </li>
              <li>Each file type requires specific columns. See documentation for details.</li>
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-md border border-error-200 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => handleImportTypeChange('excel')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  importType === 'excel'
                    ? 'bg-primary-50 text-primary-600 border-primary-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Excel Import
              </button>
              
              <button
                type="button"
                onClick={() => handleImportTypeChange('csv')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  importType === 'csv'
                    ? 'bg-primary-50 text-primary-600 border-primary-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <FileText className="w-5 h-5 mr-2" />
                CSV Import
              </button>
            </div>

            {/* Data Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What type of data are you uploading?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDataType('auto')}
                  className={`p-3 rounded-lg border text-sm ${
                    dataType === 'auto'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">🤖 Auto-Detect</div>
                  <div className="text-xs mt-1">Let system detect</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDataType('contact')}
                  className={`p-3 rounded-lg border text-sm ${
                    dataType === 'contact'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">👥 Contacts</div>
                  <div className="text-xs mt-1">Names, emails, phones</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDataType('case')}
                  className={`p-3 rounded-lg border text-sm ${
                    dataType === 'case'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">📋 Cases</div>
                  <div className="text-xs mt-1">Plaintiff, defendant</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDataType('hearing')}
                  className={`p-3 rounded-lg border text-sm ${
                    dataType === 'hearing'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">⚖️ Hearings</div>
                  <div className="text-xs mt-1">Court dates, outcomes</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDataType('invoice')}
                  className={`p-3 rounded-lg border text-sm ${
                    dataType === 'invoice'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">💰 Invoices</div>
                  <div className="text-xs mt-1">Billing, amounts</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDataType('document')}
                  className={`p-3 rounded-lg border text-sm ${
                    dataType === 'document'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">📄 Documents</div>
                  <div className="text-xs mt-1">Files, doc types</div>
                </button>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex text-sm justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                >
                  <span>Upload {importType === 'excel' ? 'Excel' : 'CSV'} file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept={importType === 'excel' ? '.xlsx' : '.csv'}
                    onChange={handleFileChange}
                    multiple={false}
                    ref={fileInputRef}
                  />
                </label>
                <p className="pl-1 text-gray-500">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {importType === 'excel' 
                  ? 'Excel file (.xlsx) containing case data'
                  : 'CSV file (.csv) containing case data'
                }
              </p>
              {importType === 'csv' && (
                <p className="text-xs text-blue-600 mt-2">
                  Note: For CSV imports, you'll be able to preview and map columns to help with correct data identification
                </p>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="font-medium">{file.name}</span>
                      <span className="ml-2 text-gray-500 text-sm">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || isImporting}
              >
                {isImporting ? 'Analyzing...' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {step === 'csvInspector' && selectedCsvFile && (
          <CSVDataInspector 
            file={selectedCsvFile}
            onClose={handleReset}
            onImport={handleCsvImportComplete}
          />
        )}

        {step === 'preview' && importResult && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Import Preview</h3>
            
            <div className="bg-gray-50 rounded-md p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 mb-2">
                  <h4 className="font-medium text-gray-700">Data Summary</h4>
                </div>
                
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Cases: {importResult.entities.cases.length}</span>
                </div>
                
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Hearings: {importResult.entities.hearings.length}</span>
                </div>
                
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Documents: {importResult.entities.documents.length}</span>
                </div>
                
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Invoices: {importResult.entities.invoices.length}</span>
                </div>
                
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Service Logs: {importResult.entities.serviceLogs.length}</span>
                </div>
                
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Contacts: {importResult.entities.contacts.length}</span>
                </div>
              </div>
              
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Warnings</h4>
                  <ul className="text-sm text-yellow-700 bg-yellow-50 rounded-md p-2">
                    {importResult.warnings.slice(0, 5).map((warning: string, i: number) => (
                      <li key={i} className="ml-4 list-disc">{warning}</li>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <li className="ml-4 list-disc">
                        {importResult.warnings.length - 5} more warnings...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleImport} 
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Importing data...</p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-success-100">
              <CheckCircle className="h-10 w-10 text-success-600" />
            </div>
            <h3 className="text-lg font-medium">Import Complete</h3>
            <p className="text-gray-600">
              All data has been successfully imported into the system.
            </p>
            <div className="pt-4 flex justify-center">
              <Button variant="primary" onClick={handleReset}>
                Return to Import Tool
              </Button>
            </div>
          </div>
        )}
        
        <ImportFormatGuide 
          isOpen={showFormatGuide} 
          onClose={() => setShowFormatGuide(false)}
          importType={importType}
        />
      </Card>
    </div>
  );
};

export default DataImportTool;