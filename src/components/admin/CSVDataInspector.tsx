import React, { useState } from 'react';
import Papa from 'papaparse';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import { AlertTriangle, Check, Info } from 'lucide-react';
import {
  detectFieldType,
  generateFieldMappingSuggestions,
  EMAIL_PATTERNS,
  PHONE_PATTERNS,
  ADDRESS_PATTERNS,
  NAME_PATTERNS,
  scoreFieldMatch,
} from '../../utils/dataImport/fieldDetector';

interface CSVDataInspectorProps {
  file: File;
  onClose: () => void;
  onImport: (mappedData: any, fileType: string) => void;
}

const CSVDataInspector: React.FC<CSVDataInspectorProps> = ({ file, onClose, onImport }) => {
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [fileType, setFileType] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [detectedFields, setDetectedFields] = useState<{
    caseId?: string;
    plaintiff?: string;
    defendant?: string;
    address?: string;
    costs?: string[];
  }>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Column mapping options based on expected data
  const fieldOptions = [
    // Case fields (from caseSchema)
    { value: "caseId", label: "Case ID" },
    { value: "plaintiff", label: "Plaintiff" },
    { value: "defendant", label: "Defendant" },
    { value: "address", label: "Property Address" },
    { value: "status", label: "Case Status" },
    { value: "dateFiled", label: "Date Filed" },
    
    // Contact fields (from contactSchema)
    { value: "contactId", label: "Contact ID" },
    { value: "name", label: "Contact Name" },
    { value: "role", label: "Contact Role (Attorney/Paralegal/PM/Client/Other)" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "company", label: "Company" },
    { value: "contactAddress", label: "Contact Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "zipCode", label: "Zip Code" },
    { value: "notes", label: "Notes" },
    
    // Hearing fields (from hearingSchema)
    { value: "hearingId", label: "Hearing ID" },
    { value: "courtName", label: "Court Name" },
    { value: "hearingDate", label: "Hearing Date" },
    { value: "outcome", label: "Hearing Outcome" },
    
    // Document fields (from documentSchema)
    { value: "docId", label: "Document ID" },
    { value: "type", label: "Document Type (Complaint/Summons/Affidavit/Motion/Order/Other)" },
    { value: "fileURL", label: "File URL" },
    { value: "serviceDate", label: "Service Date" },
    
    // Invoice fields (from invoiceSchema)
    { value: "invoiceId", label: "Invoice ID" },
    { value: "amount", label: "Amount" },
    { value: "issueDate", label: "Issue Date" },
    { value: "dueDate", label: "Due Date" },
    { value: "paid", label: "Paid (true/false)" },
    
    // Service Log fields (from serviceLogSchema)
    { value: "logId", label: "Service Log ID" },
    { value: "method", label: "Service Method (Sheriff/SPS)" },
    { value: "attemptDate", label: "Attempt Date" },
    { value: "result", label: "Service Result (Success/Failed)" },
    
    { value: "notUsed", label: "Not Used" },
  ];

  // Using a workaround to avoid the dependency array issue
  // parseCSV has a stable reference but ESLint doesn't know that
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    parseCSV();
  }, [file]);

  React.useEffect(() => {
    setWarnings(validateMappings());
  }, [fieldMappings]);

  const parseCSV = async () => {
    setLoading(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        console.log('=== CSV FILE CONTENT ===');
        console.log('Raw content length:', csvContent.length);
        console.log('First 200 characters:', JSON.stringify(csvContent.substring(0, 200)));
        console.log('Content preview:', csvContent.substring(0, 200));
        
        // Function to handle parse results
        const handleParseResults = (results: any) => {
          if (results.errors.length > 0) {
            setErrors(results.errors.map((err: any) => `Error: ${err.message} (row: ${err.row})`));
          }
          
          const parsedHeaders = results.meta.fields || [];
          console.log('=== PARSED HEADERS ===');
          console.log('Raw headers array:', parsedHeaders);
          console.log('Number of headers:', parsedHeaders.length);
          parsedHeaders.forEach((header, index) => {
            console.log(`Header ${index}:`, JSON.stringify(header));
          });
          
          setHeaders(parsedHeaders);
          
          // Take a sample of the first 5 rows for preview
          const previewData = results.data.slice(0, 5);
          console.log('=== PREVIEW DATA ===');
          console.log('Number of preview rows:', previewData.length);
          if (previewData.length > 0) {
            console.log('First row keys:', Object.keys(previewData[0]));
            console.log('First row values:', previewData[0]);
          }
          
          setDataPreview(previewData);
          setFileData(results.data);
            
          // Detect file type based on column patterns
          detectFileType(parsedHeaders, previewData);
            
          setLoading(false);
        };
        
        // Enhanced delimiter detection
        const firstLine = csvContent.split('\n')[0] || '';
        console.log('First line for delimiter detection:', firstLine);
        
        let delimiter = ',';
        
        // Count potential delimiters outside of quoted strings
        const commaCount = (firstLine.match(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g) || []).length;
        const semiCount = (firstLine.match(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        
        console.log('Delimiter counts:', { commaCount, semiCount, tabCount });
        
        if (semiCount > commaCount && semiCount > tabCount) {
          delimiter = ';';
        } else if (tabCount > commaCount && tabCount > semiCount) {
          delimiter = '\t';
        } else {
          delimiter = ',';
        }
        
        console.log('Selected delimiter:', delimiter);

        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          delimiter: delimiter,
          quoteChar: '"',
          escapeChar: '"',
          transformHeader: (header) => {
            // Clean header by removing surrounding quotes and whitespace
            return header.trim().replace(/^["']|["']$/g, '');
          },
          complete: (results) => {
            console.log('Parse results:', results);
            console.log('Headers found:', results.meta.fields);
            
            // Check if parsing failed (only 1 column detected when we expect more)
            const headers = results.meta.fields || [];
            if (headers.length === 1 && headers[0] && (headers[0].includes(',') || headers[0].includes(';'))) {
              console.log('Parsing failed, retrying with different settings');
              // Parsing failed, try with auto-detection disabled
              Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true,
                delimiter: '',  // Let Papa auto-detect
                quoteChar: '"',
                escapeChar: '"',
                transformHeader: (header) => {
                  return header.trim().replace(/^["']|["']$/g, '');
                },
                complete: handleParseResults
              });
            } else {
              handleParseResults(results);
            }
          }
        });
      } catch (error) {
        setErrors([`Failed to read file: ${error}`]);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setErrors(['Failed to read the file']);
      setLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const detectFileType = (headers: string[], data: any[]) => {
    let fileType = 'unknown';
    const detectedFields: any = {};
    
    // Check for unnamed column pattern
    const unnamedColumns = headers.filter(h => h.startsWith('unnamed_'));
    if (unnamedColumns.length > 10) {
      fileType = 'all_evictions_files';
      
      // Try to identify key columns
      // Look for numbers that might be case IDs in first unnamed column
      if (data.length > 0 && data[0].unnamed_0) {
        detectedFields.caseId = 'unnamed_0';
      }
      
      // Look for parties in next columns
      if (data.length > 0) {
        // Check for name patterns in columns
        for (let i = 1; i < 5; i++) {
          const colName = `unnamed_${i}`;
          const value = data[0][colName];
          if (value && typeof value === 'string') {
            if (value.includes('Management') || value.includes('Property') || value.includes('LLC')) {
              detectedFields.plaintiff = colName;
            } else if (!detectedFields.defendant && value.length > 0) {
              detectedFields.defendant = colName;
            }
          }
        }
        
        // Look for address pattern
        for (let i = 2; i < 6; i++) {
          const colName = `unnamed_${i}`;
          const value = data[0][colName];
          if (value && typeof value === 'string' && 
              (value.includes('Ave') || value.includes('St') || value.includes('Dr') || 
               value.includes('Road') || /\d+/.test(value))) {
            detectedFields.address = colName;
            break;
          }
        }
        
        // Find cost columns
        const costColumns = headers.filter(h => 
          h.includes('cost') || h.includes('fee') || h.includes('owed') || h.includes('paid')
        );
        if (costColumns.length > 0) {
          detectedFields.costs = costColumns;
        }
      }
    } else if (headers.some(h => h.toLowerCase().includes('plaintiff') || h.toLowerCase().includes('defendant'))) {
      fileType = 'complaint';
    } else if (headers.some(h => h.toLowerCase().includes('court') || h.toLowerCase().includes('hearing'))) {
      fileType = 'hearing';
    } else if (headers.some(h => h.toLowerCase().includes('email') || h.toLowerCase().includes('phone') || h.toLowerCase().includes('contact'))) {
      fileType = 'contact';
    } else if (headers.some(h => h.toLowerCase().includes('invoice') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('paid'))) {
      fileType = 'invoice';
    } else if (headers.some(h => h.toLowerCase().includes('document') || h.toLowerCase().includes('file'))) {
      fileType = 'document';
    }
    
    setFileType(fileType);
    setDetectedFields(detectedFields);
    
    // Set initial mappings using new field detector
    const suggestions = generateFieldMappingSuggestions(headers, data.slice(0, 10));
    const initialMappings: Record<string, string> = { ...suggestions };

    if (fileType === 'all_evictions_files') {
      if (detectedFields.caseId) initialMappings[detectedFields.caseId] = 'caseId';
      if (detectedFields.plaintiff) initialMappings[detectedFields.plaintiff] = 'plaintiff';
      if (detectedFields.defendant) initialMappings[detectedFields.defendant] = 'defendant';
      if (detectedFields.address) initialMappings[detectedFields.address] = 'address';
      if (detectedFields.costs) {
        detectedFields.costs.forEach((c: string) => {
          initialMappings[c] = 'costs';
        });
      }
    }
    const scores: Record<string, number> = {};
    Object.entries(initialMappings).forEach(([header, field]) => {
      let patterns: string[] = [];
      if (field === 'email') patterns = EMAIL_PATTERNS;
      if (field === 'phone') patterns = PHONE_PATTERNS;
      if (field === 'address') patterns = ADDRESS_PATTERNS;
      if (field === 'name') patterns = NAME_PATTERNS;
      scores[header] = Math.max(0, ...patterns.map(p => scoreFieldMatch(header, p)));
    });
    setMatchScores(scores);
    setFieldMappings(initialMappings);
  };
  
  const handleMappingChange = (header: string, value: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const handleAutoDetect = () => {
    const suggestions = generateFieldMappingSuggestions(headers, fileData.slice(0, 10));
    const newMappings = { ...fieldMappings, ...suggestions };
    setFieldMappings(newMappings);
  };

  const getColumnValues = (header: string): string[] => {
    return fileData.slice(0, 10).map(row => String(row[header] ?? ''));
  };

  const validateMappings = () => {
    const warnings: string[] = [];
    Object.entries(fieldMappings).forEach(([header, mapping]) => {
      const detectedType = detectFieldType(header, getColumnValues(header));
      if (detectedType !== mapping && detectedType !== 'unknown') {
        warnings.push(`Column "${header}" appears to contain ${detectedType} data but is mapped to ${mapping}`);
      }
    });
    return warnings;
  };
  
  const handleApplyMapping = () => {
    // Transform the data based on mappings
    const mappedData = fileData.map(row => {
      const transformedRow: Record<string, any> = {};
      
      // Generate a unique ID for this record if it doesn't have one already
      transformedRow.id = row.id || row.caseId || row.file_id || row.caseid || `case-${Math.random().toString(36).substring(2, 15)}`;
      
      // Apply mappings to each row
      Object.entries(fieldMappings).forEach(([sourceField, targetField]) => {
        if (targetField !== 'notUsed') {
          if (targetField === 'costs') {
            // For costs fields, collect them in an array
            if (!transformedRow.costs) transformedRow.costs = {};
            transformedRow.costs[sourceField] = row[sourceField];
          } else {
            // Handle special mapping cases
            let finalTargetField = targetField;
            if (targetField === 'contactAddress') {
              finalTargetField = 'address'; // Map contactAddress back to address in the data
            }
            
            transformedRow[finalTargetField] = row[sourceField];
            
            // For caseId field, also set it as the main identifier
            if (targetField === 'caseId' && row[sourceField]) {
              transformedRow.id = row[sourceField];
              transformedRow.caseId = row[sourceField];
            }
            
            // For contactId field, also set it as the main identifier
            if (targetField === 'contactId' && row[sourceField]) {
              transformedRow.id = row[sourceField];
              transformedRow.contactId = row[sourceField];
            }
          }
        }
      });
      
      // Add helpful logging
      console.log('Mapped row:', transformedRow);
      
      return transformedRow;
    });
    
    // Filter out empty rows
    const validMappedData = mappedData.filter(row => 
      Object.keys(row).length > 1 && // More than just the ID field
      Object.values(row).some(val => val !== null && val !== undefined && val !== '')
    );
    
    console.log(`Mapped ${validMappedData.length} valid rows out of ${mappedData.length} total rows`);
    console.log('File type being passed:', fileType);
    
    onImport(validMappedData, fileType);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">CSV Data Inspector</h2>
        <div>
          <span className="text-sm text-neutral-500 mr-2">File: {file.name}</span>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary-600 rounded-full mx-auto"></div>
          <p className="mt-4">Analyzing CSV structure...</p>
        </div>
      ) : (
        <>
          {/* File Type Detection */}
          <div className="mb-6 p-4 rounded-md bg-blue-50">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">File Analysis Results</h3>
                <p className="text-sm text-blue-800">
                  {fileType === 'all_evictions_files' && 'All Evictions Files format detected'}
                  {fileType === 'complaint' && 'Case/Complaint data format detected'}
                  {fileType === 'hearing' && 'Hearing data format detected'}
                  {fileType === 'contact' && 'Contact data format detected'}
                  {fileType === 'invoice' && 'Invoice data format detected'}
                  {fileType === 'document' && 'Document data format detected'}
                  {fileType === 'unknown' && 'Unknown data format - please manually map columns'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {headers.length} columns, {fileData.length} rows found
                </p>
              </div>
            </div>
          </div>
          
          {/* Errors if any */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Parsing Issues</h3>
                  <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Mapping Warnings</h3>
                  <ul className="mt-1 list-disc list-inside text-sm text-yellow-700">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Field Mapping */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Column Mapping</h3>
            <p className="text-sm text-neutral-600 mb-3">
              Please confirm or adjust the automatic field mappings. Map important columns to their correct field types.
            </p>
            
            <div className="max-h-80 overflow-y-auto border rounded-md p-2">
              <table className="min-w-full border-separate" style={{ borderSpacing: '0 4px' }}>
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider sticky top-0 bg-neutral-50">
                      CSV Column
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider sticky top-0 bg-neutral-50">
                      Maps To
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider sticky top-0 bg-neutral-50">
                      Sample Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {headers.map((header) => (
                    <tr key={header} className="bg-white">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-900">
                        {header}
                        <span className={`ml-1 inline-block w-2 h-2 rounded-full ${getConfidenceColor(matchScores[header] || 0)}`}></span>
                        {detectedFields.caseId === header && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            ID
                          </span>
                        )}
                        {detectedFields.plaintiff === header && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            PLTF
                          </span>
                        )}
                        {detectedFields.defendant === header && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                            DEF
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <select
                          value={fieldMappings[header] || 'notUsed'}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          className="w-full border-neutral-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          {fieldOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-500 max-w-xs truncate">
                        {dataPreview.length > 0 ? dataPreview[0][header] : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-2 text-xs text-neutral-500">
              <p>
                <span className="font-medium">Tip:</span> Map the most important columns first (Case ID, Plaintiff, Defendant, Address, Costs)
              </p>
            </div>
          </div>
          
          {/* Data Preview */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Data Preview</h3>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-neutral-50">
                  <tr>
                    {headers.slice(0, 5).map((header) => (
                      <th 
                        key={header} 
                        className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                    {headers.length > 5 && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        ...
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataPreview.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      {headers.slice(0, 5).map((header) => (
                        <td key={`${idx}-${header}`} className="px-4 py-2 whitespace-nowrap text-sm text-neutral-500 max-w-xs truncate">
                          {row[header] || '-'}
                        </td>
                      ))}
                      {headers.length > 5 && (
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-500">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Showing {dataPreview.length} of {fileData.length} rows
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleAutoDetect}>
              Auto-detect
            </Button>
            <Button
              variant="primary"
              onClick={handleApplyMapping}
              disabled={Object.keys(fieldMappings).length === 0}
            >
              <Check className="w-4 h-4 mr-1" />
              Apply Mapping & Import
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default CSVDataInspector;
