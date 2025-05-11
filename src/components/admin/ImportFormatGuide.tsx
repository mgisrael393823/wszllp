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
              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
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
            <p className="text-gray-700">
              {importType === 'excel' 
                ? 'This guide explains the required format for Excel files to import data into the system.' 
                : 'This guide explains the required format for CSV files to import data into the system.'}
            </p>
            
            <h3 className="mt-4">General Requirements</h3>
            
            {importType === 'excel' ? (
              <>
                <p>Your Excel file should contain the following worksheets:</p>
                <ul>
                  <li><strong>Case Data:</strong> Complaints, ALL EVICTIONS FILES</li>
                  <li><strong>Hearings:</strong> Court 25, Court 24, ZOOM</li>
                  <li><strong>Documents:</strong> Summons, ALIAS Summons, Aff of Serv</li>
                  <li><strong>Service:</strong> SPS 25, SPS & ALIAS, SHERIFF, SHERIFF EVICTIONS</li>
                  <li><strong>Invoices:</strong> Outstanding Invoices, New Invoice List, Final Invoices, Payment Plan</li>
                  <li><strong>Contacts:</strong> PM INFO</li>
                </ul>
              </>
            ) : (
              <>
                <p>For CSV imports, you need to provide multiple files:</p>
                <ul>
                  <li>Files must be comma-separated (.csv files)</li>
                  <li>Each file must have a header row with column names</li>
                  <li>Filenames should indicate their content category</li>
                  <li>Text with commas should be enclosed in double quotes</li>
                </ul>
                
                <p>Required files (name them exactly as shown or use the naming guidelines below):</p>
                <ul>
                  <li>Cases: <code>complaints.csv</code> or <code>all-evictions.csv</code></li>
                  <li>Hearings: <code>court-25.csv</code> and/or <code>court-24.csv</code></li>
                  <li>Optional: <code>zoom.csv</code> for Zoom hearing information</li>
                  <li>Optional: <code>summons.csv</code>, <code>alias-summons.csv</code> for documents</li>
                  <li>Optional: <code>sps-25.csv</code>, <code>sheriff.csv</code> for service logs</li>
                  <li>Optional: <code>outstanding-invoices.csv</code>, <code>payment-plan.csv</code> for billing</li>
                  <li>Optional: <code>pm-info.csv</code> or <code>clients.csv</code> for contact information</li>
                </ul>
              </>
            )}

            <h3 className="mt-4">Required Data Fields</h3>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Sheet/File</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Required Fields</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 font-medium">Complaint / complaints.csv</td>
                    <td className="px-3 py-2">file id, plaintiff, defendant, address, date</td>
                    <td className="px-3 py-2">Case filing information</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">ALL EVICTIONS FILES / all-evictions.csv</td>
                    <td className="px-3 py-2">file, file id, client, property, defendant</td>
                    <td className="px-3 py-2">Comprehensive case listing</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Court 25 / court-25.csv</td>
                    <td className="px-3 py-2">file id, court, date, time, defendant</td>
                    <td className="px-3 py-2">Court hearings for department 25</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">ZOOM / zoom.csv</td>
                    <td className="px-3 py-2">file id, meeting id, password, link</td>
                    <td className="px-3 py-2">Zoom hearing information</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">PM INFO / pm-info.csv</td>
                    <td className="px-3 py-2">client, name, contact, phone, email</td>
                    <td className="px-3 py-2">Property manager/client information</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-4">CSV File Naming Guidelines</h3>
            
            {importType === 'csv' && (
              <p>The system will attempt to match your file names to the expected data categories. Here are the recognized naming patterns:</p>
            )}
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Data Category</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Recognized File Names</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 font-medium">Cases (Complaint sheet)</td>
                    <td className="px-3 py-2">complaint.csv, complaints.csv</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Cases (ALL EVICTIONS FILES)</td>
                    <td className="px-3 py-2">all-evictions.csv, all-evictions-files.csv, allevictions.csv, evictions.csv</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Hearings (Court 25)</td>
                    <td className="px-3 py-2">court25.csv, court-25.csv</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Hearings (Court 24)</td>
                    <td className="px-3 py-2">court24.csv, court-24.csv</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Hearings (Zoom)</td>
                    <td className="px-3 py-2">zoom.csv, zoom-info.csv, zoom-data.csv</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Contacts (PM INFO)</td>
                    <td className="px-3 py-2">pm-info.csv, pm.csv, clients.csv, client-info.csv</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-4">Example CSV Format</h3>
            
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {`# Example complaints.csv
file id,plaintiff,defendant,address,date filed
"EV2023-001","Smith Property Group","John Doe","123 Main St Apt 4, Anytown, CA 90210","2023-09-15"
"EV2023-002","ABC Apartments","Jane Smith","456 Oak Ave #2, Anytown, CA 90210","2023-09-16"`}
            </pre>
            
            <h3 className="mt-4">Troubleshooting</h3>
            
            <ul>
              <li><strong>No data imported:</strong> Ensure your file names match the expected patterns and contain the required headers</li>
              <li><strong>CSV parsing errors:</strong> Make sure your CSV files use comma separators and text with commas is properly quoted</li>
              <li><strong>Missing relationships:</strong> Ensure the "file id" field is consistent across related files</li>
            </ul>
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