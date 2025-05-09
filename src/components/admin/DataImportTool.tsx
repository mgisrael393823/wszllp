import React, { useState } from 'react';
import { importFromExcel } from '../../utils/dataImport/excelImporter';
import { useData } from '../../context/DataContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Upload, CheckCircle, AlertCircle, FileText, Database } from 'lucide-react';

const DataImportTool: React.FC = () => {
  const { dispatch } = useData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    if (!selectedFile.name.endsWith('.xlsx')) {
      setError('Please upload an Excel file (.xlsx)');
      return;
    }

    setError(null);
    setStep('preview');
    setIsImporting(true);

    try {
      const result = await importFromExcel(selectedFile);
      setImportResult(result);
      setIsImporting(false);

      if (result.success) {
        setStep('preview');
      } else {
        setError('Import failed. Please check the file format and try again.');
        setStep('upload');
      }
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : String(err)}`);
      setIsImporting(false);
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!importResult) return;

    setIsImporting(true);
    setStep('importing');

    try {
      // Import data into the application
      const { entities } = importResult;

      // Load all the data in a single dispatch
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          cases: entities.cases,
          hearings: entities.hearings,
          documents: entities.documents,
          serviceLogs: entities.serviceLogs,
          invoices: entities.invoices,
          paymentPlans: entities.paymentPlans,
          contacts: entities.contacts,
          zoomLinks: [], // Not directly imported
          auditLogs: [] // New audit logs will be generated during import
        }
      });

      setStep('complete');
    } catch (err) {
      setError(`Error applying import: ${err instanceof Error ? err.message : String(err)}`);
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setStep('upload');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Data Import Tool</h2>
          {step !== 'upload' && (
            <Button variant="outline" onClick={handleReset} size="sm">
              Start Over
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-md border border-error-200 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex text-sm justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                >
                  <span>Upload Excel file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1 text-gray-500">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Excel file (.xlsx) containing case data
              </p>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="ml-2 text-gray-500 text-sm">
                    ({Math.round(selectedFile.size / 1024)} KB)
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleUpload} 
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? 'Analyzing...' : 'Next'}
              </Button>
            </div>
          </div>
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
              
              {importResult.warnings.length > 0 && (
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
      </Card>
    </div>
  );
};

export default DataImportTool;