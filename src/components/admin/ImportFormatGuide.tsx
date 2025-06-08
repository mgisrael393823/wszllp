import React from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@radix-ui/react-dialog';
import Button from '../ui/Button';
import { FileSpreadsheet, FileText, X } from 'lucide-react';

interface ImportFormatGuideProps {
  isOpen: boolean;
  onClose: () => void;
  importType?: 'excel' | 'csv';
}

const ImportFormatGuide: React.FC<ImportFormatGuideProps> = ({
  isOpen,
  onClose,
  importType = 'excel' // Default to Excel
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/60" /> {/* Darker overlay */}
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl max-h-[90vh] overflow-y-auto transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              {importType === 'excel' ? (
                <>
                  <FileSpreadsheet className="w-6 h-6 mr-2 text-emerald-600 flex-shrink-0" />
                  <span>Excel Import Format Guide</span>
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6 mr-2 text-blue-600 flex-shrink-0" />
                  <span>CSV Import Format Guide</span>
                </>
              )}
            </h2>
            <button 
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Hidden DialogTitle for accessibility */}
          <DialogTitle className="sr-only">
            {importType === 'excel' ? 'Excel Import Format Guide' : 'CSV Import Format Guide'}
          </DialogTitle>

          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-neutral-700">
              The import system uses intelligent content detection to automatically identify and process your data. You can use any file/sheet names - the system will detect the data type based on your column headers.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="text-blue-800 font-medium mb-2">🚀 Smart Detection</h4>
              <p className="text-blue-700 text-sm">
                No need for specific file names! The system automatically detects:
              </p>
              <ul className="text-blue-700 text-sm mt-2 ml-4">
                <li><strong>Contact data</strong> - files with email, phone, or contact columns</li>
                <li><strong>Case data</strong> - files with plaintiff, defendant, or case columns</li>
                <li><strong>Hearing data</strong> - files with court, hearing, or date columns</li>
                <li><strong>Invoice data</strong> - files with amount, paid, or invoice columns</li>
                <li><strong>Document data</strong> - files with document, file, or type columns</li>
              </ul>
            </div>

            <h3 className="mt-4">Supported Data Types</h3>
            
            {importType === 'excel' ? (
              <p>Your Excel file can contain any number of sheets with any names. Each sheet will be automatically analyzed for content type.</p>
            ) : (
              <p>Upload CSV files containing any type of data. The system will automatically detect the content type based on your column headers.</p>
            )}

            <h3 className="mt-4">Platform Data Fields</h3>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Data Type</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Required Fields</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Optional Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 font-medium text-green-700">📋 Cases</td>
                    <td className="px-3 py-2">plaintiff, defendant, address</td>
                    <td className="px-3 py-2">caseId, status, intakeDate</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-blue-700">👥 Contacts</td>
                    <td className="px-3 py-2">name, email</td>
                    <td className="px-3 py-2">role, phone, company, address, notes</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-purple-700">⚖️ Hearings</td>
                    <td className="px-3 py-2">courtName, hearingDate</td>
                    <td className="px-3 py-2">hearingId, caseId, outcome</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-orange-700">💰 Invoices</td>
                    <td className="px-3 py-2">amount, issueDate</td>
                    <td className="px-3 py-2">invoiceId, caseId, dueDate, paid</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-red-700">📄 Documents</td>
                    <td className="px-3 py-2">type, fileURL</td>
                    <td className="px-3 py-2">docId, caseId, serviceDate</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <h4 className="text-yellow-800 font-medium mb-2">💡 Field Mapping Tips</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li><strong>Flexible headers:</strong> Use headers like "Name", "Contact Name", "Full Name" - all will map to the name field</li>
                <li><strong>Status values:</strong> For cases, use "Intake", "Active", or "Closed"</li>
                <li><strong>Contact roles:</strong> Use "Attorney", "Paralegal", "PM", "Client", or "Other"</li>
                <li><strong>Document types:</strong> Use "Complaint", "Summons", "Affidavit", "Motion", "Order", or "Other"</li>
                <li><strong>Boolean fields:</strong> Use "true"/"false" or "yes"/"no" for paid status</li>
              </ul>
            </div>

            <h3 className="mt-4">How Detection Works</h3>
            
            <p>The system uses intelligent content analysis rather than file names. Detection is based on your column headers:</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Data Type</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Detection Triggers</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Example Headers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 font-medium text-green-700">Cases</td>
                    <td className="px-3 py-2">plaintiff, defendant, case columns</td>
                    <td className="px-3 py-2">"Plaintiff Name", "Defendant", "Case Number"</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-blue-700">Contacts</td>
                    <td className="px-3 py-2">email, phone, contact columns</td>
                    <td className="px-3 py-2">"Email Address", "Phone", "Contact Name"</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-purple-700">Hearings</td>
                    <td className="px-3 py-2">court, hearing, date columns</td>
                    <td className="px-3 py-2">"Court Name", "Hearing Date", "Court Room"</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-orange-700">Invoices</td>
                    <td className="px-3 py-2">invoice, amount, paid columns</td>
                    <td className="px-3 py-2">"Invoice Number", "Amount Due", "Paid Status"</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-red-700">Documents</td>
                    <td className="px-3 py-2">document, file, type columns</td>
                    <td className="px-3 py-2">"Document Type", "File URL", "File Name"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-4">Example Data Formats</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">📋 Cases Example:</h4>
                <pre className="bg-neutral-100 p-2 rounded text-xs overflow-x-auto">
{`Case ID,Plaintiff,Defendant,Property Address,Status,Intake Date
"WSZ-2023-001","Smith Property LLC","John Doe","123 Main St #4","Active","2023-09-15"
"WSZ-2023-002","ABC Apartments","Jane Smith","456 Oak Ave #2","Intake","2023-09-16"`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">👥 Contacts Example:</h4>
                <pre className="bg-neutral-100 p-2 rounded text-xs overflow-x-auto">
{`Contact Name,Role,Email,Phone,Company,Notes
"John Smith","Attorney","john@lawfirm.com","555-1234","Smith & Associates","Primary contact"
"Mary Johnson","PM","mary@properties.com","555-5678","ABC Properties","Property manager"`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">⚖️ Hearings Example:</h4>
                <pre className="bg-neutral-100 p-2 rounded text-xs overflow-x-auto">
{`Hearing ID,Case ID,Court Name,Hearing Date,Outcome
"H-001","WSZ-2023-001","Municipal Court Dept 1","2023-10-15","Judgment for Plaintiff"
"H-002","WSZ-2023-002","Municipal Court Dept 2","2023-10-20",""`}
                </pre>
              </div>
            </div>
            
            <h3 className="mt-4">Troubleshooting</h3>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-red-800 font-medium mb-2">⚠️ Common Issues</h4>
              <ul className="text-red-700 text-sm space-y-1">
                <li><strong>No data detected:</strong> Ensure your headers contain recognizable keywords (plaintiff, email, court, etc.)</li>
                <li><strong>Wrong data type detected:</strong> Check that your headers clearly indicate the content type</li>
                <li><strong>CSV parsing errors:</strong> Enclose text containing commas in double quotes</li>
                <li><strong>Missing required fields:</strong> Include at least the required fields for your data type</li>
                <li><strong>Date format issues:</strong> Use YYYY-MM-DD format for dates (e.g., 2023-09-15)</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t sticky bottom-0 bg-white">
            <Button variant="primary" onClick={onClose}>
              Close Guide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFormatGuide;