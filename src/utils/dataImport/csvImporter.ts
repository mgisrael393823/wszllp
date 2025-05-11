import Papa from 'papaparse';
import { Case, Hearing, Document, Invoice, PaymentPlan, Contact, ServiceLog } from '../../types/schema';
import casesParser from './casesParser';
import hearingsParser from './hearingsParser';
import documentsParser from './documentsParser';
import invoicesParser from './invoicesParser';
import clientsParser from './clientsParser';
import csvFieldMapper from './csvFieldMapper';

interface ImportResult {
  success: boolean;
  entities: {
    cases: Case[];
    hearings: Hearing[];
    documents: Document[];
    invoices: Invoice[];
    paymentPlans: PaymentPlan[];
    contacts: Contact[];
    serviceLogs: ServiceLog[];
  };
  errors: string[];
  warnings: string[];
  stats: {
    totalFiles: number;
    processedFiles: number;
    processedRows: number;
  };
}

/**
 * Import data from CSV files
 */
export async function importFromCSV(files: File[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    entities: {
      cases: [],
      hearings: [],
      documents: [],
      invoices: [],
      paymentPlans: [],
      contacts: [],
      serviceLogs: [],
    },
    errors: [],
    warnings: [],
    stats: {
      totalFiles: files.length,
      processedFiles: 0,
      processedRows: 0,
    }
  };
  
  try {
    console.log('Starting CSV import process...');
    
    // Create an object to store all parsed data, similar to Excel sheets
    const allSheets: { [key: string]: any[] } = {};
    
    // Process each CSV file
    for (const file of files) {
      const fileName = file.name.replace('.csv', '');
      // Use the new custom field mapper to determine sheet name
      const sheetName = csvFieldMapper.mapCustomFileNameToSheetName(fileName);
      
      try {
        // Parse CSV file content
        const csvContent = await readFileAsText(file);
        
        // Check if file contains content
        if (!csvContent || csvContent.trim() === '') {
          result.warnings.push(`File ${fileName} appears to be empty`);
          continue;
        }
        
        console.log(`Parsing CSV file: ${fileName}, First 100 chars: ${csvContent.substring(0, 100)}...`);
        
        // Attempt to detect delimiter if needed
        let delimiter = ',';
        const firstLine = csvContent.split('\n')[0];
        
        // Count potential delimiters to determine the most likely one
        if (firstLine) {
          const counts = {
            ',': (firstLine.match(/,/g) || []).length,
            '\t': (firstLine.match(/\t/g) || []).length,
            ';': (firstLine.match(/;/g) || []).length,
            '|': (firstLine.match(/\|/g) || []).length
          };
          
          // Find the delimiter with the highest count
          let maxCount = 0;
          let maxDelimiter = ',';
          
          for (const [del, count] of Object.entries(counts)) {
            if (count > maxCount) {
              maxCount = count;
              maxDelimiter = del;
            }
          }
          
          delimiter = maxDelimiter;
          
          if (delimiter !== ',') {
            console.log(`Detected non-standard delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}" in file ${fileName}`);
          }
        }
        
        // Log what delimiter we're using
        console.log(`Using delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}" for file ${fileName}`);
        
        const parsedData = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          delimiter: delimiter, // Use detected or default delimiter
          quoteChar: '"', // Set quote character
          escapeChar: '"', // Set escape character
          transformHeader: header => header ? header.trim() : '', // Trim header names
          comments: '#', // Allow # as comment character
          error: (error) => {
            console.error(`Error parsing ${fileName}:`, error);
          },
          // Special handler for Excel's weird CSV exports
          transform: (value, field) => {
            if (typeof value === 'string') {
              // Handle Excel's date format that uses quotes around dates
              if (/^\"\d{1,2}\/\d{1,2}\/\d{2,4}\"$/.test(value)) {
                return value.replace(/\"/g, '');
              }
              // Remove BOM characters that Excel sometimes adds
              if (value.charCodeAt(0) === 0xFEFF) {
                return value.slice(1);
              }
            }
            return value;
          }
        });
        
        if (parsedData.errors.length > 0) {
          console.warn(`Parsing errors in ${fileName}:`, parsedData.errors);
          
          // Filter out less important errors to avoid overwhelming the user
          const criticalErrors = parsedData.errors.filter(e => 
            !e.message.includes('Delimiter') && 
            !e.message.includes('Quotes')
          );
          
          if (criticalErrors.length > 0) {
            result.warnings.push(`Errors parsing ${fileName}: ${criticalErrors.map(e => e.message).join(', ')}`);
          } else if (parsedData.errors.length > 0) {
            // Just log the first delimiter-related error
            result.warnings.push(`Minor formatting issues in ${fileName}, but data was imported`);
          }
        }
        
        // Check if we actually got data
        if (!parsedData.data || parsedData.data.length === 0) {
          result.warnings.push(`No data rows found in ${fileName}`);
          continue;
        }
        
        // Log the headers found for debugging
        const headers = parsedData.meta.fields || [];
        console.log(`CSV file ${fileName} headers: ${headers.join(', ')}`);
        console.log(`Found ${parsedData.data.length} data rows`);
        
        // Check for unnamed columns pattern like in all_evictions_files_cleaned.csv
        const unnamedColumnCount = headers.filter(h => h.startsWith('unnamed_')).length;
        if (unnamedColumnCount > 10) {
          console.log(`Detected ${unnamedColumnCount} unnamed columns, likely an all_evictions_files format`);
          
          // Force mapping to ALL EVICTIONS FILES if we detect many unnamed columns
          sheetName = 'ALL EVICTIONS FILES';
          console.log(`Remapped to sheet type: ${sheetName} based on unnamed column pattern`);
          
          // Check if we have important financial columns that would indicate this is the right format
          const hasFinancialColumns = headers.some(h => 
            h.includes('total_cost') || 
            h.includes('atty_fee') || 
            h.includes('owed')
          );
          
          if (hasFinancialColumns) {
            console.log('Financial columns detected, confirmed as eviction data format');
          }
        } else {
          // Only do standard header check for files without the unnamed column pattern
          const expectedHeaders = getExpectedHeadersForSheet(sheetName);
          if (expectedHeaders.length > 0) {
            const missingHeaders = expectedHeaders.filter(
              header => !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
            );
            
            if (missingHeaders.length > 0) {
              result.warnings.push(
                `File ${fileName} mapped to sheet ${sheetName} is missing expected headers: ${missingHeaders.join(', ')}`
              );
            }
          }
        }
        
        // Transform the parsed data to match our expected format
        const transformedData = csvFieldMapper.transformDataset(parsedData.data, sheetName);
        
        // Store transformed data
        allSheets[sheetName] = transformedData;
        result.stats.processedFiles++;
        result.stats.processedRows += transformedData.length;
        
        console.log(`Processed CSV file ${fileName} as sheet ${sheetName} with ${transformedData.length} rows`);
        
        // Log a sample of the transformed data for debugging
        if (transformedData.length > 0) {
          console.log('Sample transformed row:', transformedData[0]);
        }
      } catch (error) {
        result.warnings.push(`Error processing file ${fileName}: ${error}`);
      }
    }
    
    // Once all files are parsed, continue with the same flow as Excel import
    
    // Step 1: Parse clients/contacts first
    result.entities.contacts = clientsParser.parseClients(
      allSheets['PM INFO'] || []
    );
    
    // Extract client IDs from all sheets
    const allSheetsArray = Object.entries(allSheets).map(([sheetName, data]) => ({ 
      sheetName, 
      data 
    }));
    const clientPrefixes = clientsParser.extractClientIds(allSheetsArray);
    
    // Map client prefixes to contact records
    const clientPrefixMap = clientsParser.mapClientPrefixesToContacts(
      clientPrefixes,
      result.entities.contacts
    );
    
    // Step 2: Parse cases from multiple sheets
    const casesFromComplaint = casesParser.parseCasesFromComplaint(
      allSheets['Complaint'] || []
    );
    
    const casesFromAllEvictions = casesParser.parseCasesFromAllEvictions(
      allSheets['ALL EVICTIONS FILES'] || []
    );
    
    // Merge cases from different sources
    result.entities.cases = casesParser.mergeCases([
      casesFromComplaint,
      casesFromAllEvictions
    ]);
    
    // Create a mapping of file ID to case ID for related entities
    const caseIdMapping = new Map<string, string>();
    result.entities.cases.forEach(caseObj => {
      if (caseObj.caseId) {
        caseIdMapping.set(caseObj.caseId, caseObj.caseId);
      }
    });
    
    // Step 3: Parse hearings
    const courtSheets = ['Court 25', 'Court 24'].filter(name => allSheets[name]);
    
    let allHearings: Hearing[] = [];
    for (const sheetName of courtSheets) {
      const hearings = hearingsParser.parseHearingsFromCourtSheet(
        allSheets[sheetName] || [],
        caseIdMapping
      );
      allHearings = [...allHearings, ...hearings];
    }
    
    // Parse zoom data to augment hearings
    const zoomData = hearingsParser.parseZoomData(
      allSheets['ZOOM'] || []
    );
    
    // Merge hearings with zoom information
    result.entities.hearings = hearingsParser.mergeHearingsWithZoom(
      allHearings,
      zoomData
    );
    
    // Step 4: Parse documents
    const documentSheets = {
      complaint: allSheets['Complaint'] || [],
      summons: allSheets['Summons'] || [],
      other: [...(allSheets['ALIAS Summons'] || []), ...(allSheets['Aff of Serv'] || [])]
    };
    
    result.entities.documents = documentsParser.parseDocumentsFromSheets(
      documentSheets.complaint,
      documentSheets.summons,
      documentSheets.other,
      caseIdMapping
    );
    
    // Step 5: Parse service logs
    const serviceSheets = {
      sps: [...(allSheets['SPS 25'] || []), ...(allSheets['SPS & ALIAS'] || [])],
      sheriff: [...(allSheets['SHERIFF'] || []), ...(allSheets['SHERIFF EVICTIONS'] || [])]
    };
    
    result.entities.serviceLogs = documentsParser.parseServiceLogs(
      serviceSheets.sps,
      serviceSheets.sheriff,
      result.entities.documents
    );
    
    // Step 6: Parse invoices
    const invoiceSheets = {
      outstanding: allSheets['Outstanding Invoices'] || [],
      newInvoices: allSheets['New Invoice List'] || [],
      finalInvoices: allSheets['Final Invoices'] || []
    };
    
    result.entities.invoices = invoicesParser.parseInvoices(
      invoiceSheets.outstanding,
      invoiceSheets.newInvoices,
      invoiceSheets.finalInvoices,
      caseIdMapping
    );
    
    // Step 7: Parse payment plans
    result.entities.paymentPlans = invoicesParser.parsePaymentPlans(
      allSheets['Payment Plan'] || [],
      result.entities.invoices
    );
    
    // Log message if no cases were imported
    if (result.entities.cases.length === 0) {
      console.log('No cases found in import');
      result.warnings.push('No case data was found in the imported files.');
    }
    
    // Success!
    result.success = true;
    console.log('CSV import completed successfully with:', {
      cases: result.entities.cases.length,
      hearings: result.entities.hearings.length,
      documents: result.entities.documents.length,
      contacts: result.entities.contacts.length
    });
    
  } catch (error) {
    console.error('CSV import failed:', error);
    result.success = false;
    result.errors.push(`Import failed: ${error}`);
  }
  
  return result;
}

/**
 * Helper function to read a file as text
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target?.result as string);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

/**
 * Get the expected headers for a given sheet type
 * This helps validate if the CSV file contains the right data structure
 */
function getExpectedHeadersForSheet(sheetName: string): string[] {
  const headerMap: { [key: string]: string[] } = {
    'Complaint': ['file id', 'plaintiff', 'defendant', 'address', 'date'],
    'ALL EVICTIONS FILES': [
      'file', 'file id', 'client', 'case_name', 'property_address', 
      'balance', 'filing_date', 'status', 'notes', 'total_cost', 
      'attorney_fee', 'payment_status', 'property', 'defendant'
    ],
    'Court 25': ['file id', 'court', 'date', 'time', 'defendant'],
    'Court 24': ['file id', 'court', 'date', 'time', 'defendant'],
    'ZOOM': ['file id', 'zoom', 'link', 'meeting', 'password'],
    'Summons': ['file id', 'service', 'defendant'],
    'PM INFO': ['client', 'name', 'contact', 'phone', 'email'],
    'Outstanding Invoices': ['file id', 'invoice', 'amount', 'date'],
    'Payment Plan': ['file id', 'invoice', 'plan', 'amount'],
  };
  
  return headerMap[sheetName] || [];
}

/**
 * Map CSV file name to the corresponding sheet name expected by the parsers
 */
function mapFileNameToSheetName(fileName: string): string {
  // Remove common suffixes and prefixes
  const cleanName = fileName
    .replace(/[-_\s]?csv$/i, '')
    .replace(/^data[-_\s]?/i, '')
    .trim();
  
  // Map to standard sheet names
  const nameMap: { [key: string]: string } = {
    'complaint': 'Complaint',
    'complaints': 'Complaint',
    'all-evictions': 'ALL EVICTIONS FILES',
    'all-evictions-files': 'ALL EVICTIONS FILES',
    'allevictions': 'ALL EVICTIONS FILES',
    'evictions': 'ALL EVICTIONS FILES',
    'court25': 'Court 25',
    'court-25': 'Court 25',
    'court24': 'Court 24',
    'court-24': 'Court 24',
    'zoom': 'ZOOM',
    'zoom-info': 'ZOOM',
    'zoom-data': 'ZOOM',
    'summons': 'Summons',
    'alias': 'ALIAS Summons',
    'alias-summons': 'ALIAS Summons',
    'aff-of-serv': 'Aff of Serv',
    'affidavit': 'Aff of Serv',
    'affidavits': 'Aff of Serv',
    'service-affidavits': 'Aff of Serv',
    'sps25': 'SPS 25',
    'sps-25': 'SPS 25',
    'sps': 'SPS & ALIAS',
    'sps-alias': 'SPS & ALIAS',
    'sheriff': 'SHERIFF',
    'sheriff-evictions': 'SHERIFF EVICTIONS',
    'outstanding-invoices': 'Outstanding Invoices',
    'outstanding': 'Outstanding Invoices',
    'new-invoices': 'New Invoice List',
    'new-invoice-list': 'New Invoice List',
    'final-invoices': 'Final Invoices',
    'payment-plan': 'Payment Plan',
    'payment-plans': 'Payment Plan',
    'pm-info': 'PM INFO',
    'pm': 'PM INFO',
    'clients': 'PM INFO',
    'client-info': 'PM INFO',
  };
  
  // Try to find a match in our map
  const lowerName = cleanName.toLowerCase();
  for (const [key, value] of Object.entries(nameMap)) {
    if (lowerName === key || lowerName.includes(key)) {
      return value;
    }
  }
  
  // If no match found, return the original clean name
  return cleanName;
}

export default {
  importFromCSV
};