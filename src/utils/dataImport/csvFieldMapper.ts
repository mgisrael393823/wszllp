import { formatStringValue, formatNumericValue } from './index';

/**
 * CSV Field Mapper
 * 
 * This utility maps fields from customer-specific CSV formats to the standardized
 * field names expected by our parsers.
 */

interface FieldMapping {
  // The field in the customer's CSV
  sourceField: string;
  // The field our parser expects
  targetField: string;
  // Optional transformation function
  transform?: (value: any) => any;
}

// Custom mapping for complaint files
const complaintMappings: FieldMapping[] = [
  // Original mappings
  { sourceField: 'caseid', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'case_#', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'plaintiff_1', targetField: 'Plaintiff 1', transform: (val) => formatStringValue(val) },
  { sourceField: 'defendant_1', targetField: 'Defendant 1', transform: (val) => formatStringValue(val) },
  { sourceField: 'property_address', targetField: 'Property Address', transform: (val) => formatStringValue(val) },
  { sourceField: 'city', targetField: 'City', transform: (val) => formatStringValue(val) },
  { sourceField: 'state', targetField: 'State', transform: (val) => formatStringValue(val) },
  { sourceField: 'zip', targetField: 'Zip', transform: (val) => formatStringValue(val) },
  { sourceField: 'from_date', targetField: 'From Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'to_date', targetField: 'To Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'past_due_balance', targetField: 'Past Due Balance', transform: (val) => formatNumericValue(val) },
  { sourceField: 'notice_total', targetField: 'Notice Total', transform: (val) => formatNumericValue(val) },
  { sourceField: 'court_costs', targetField: 'Court Costs', transform: (val) => formatNumericValue(val) },
  { sourceField: 'owner', targetField: 'Owner', transform: (val) => formatStringValue(val) },
  { sourceField: 'file_name', targetField: 'File Name', transform: (val) => formatStringValue(val) },
  
  // Additional mappings for unnamed fields in the all_evictions_files_cleaned.csv format
  { sourceField: 'unnamed_0', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'all_eviction_files_at_w&s', targetField: 'Case Name', transform: (val) => formatStringValue(val) },
  { sourceField: 'unnamed_2', targetField: 'Plaintiff 1', transform: (val) => formatStringValue(val) },
  { sourceField: 'unnamed_3', targetField: 'Defendant 1', transform: (val) => formatStringValue(val) },
  { sourceField: 'unnamed_4', targetField: 'Property Address', transform: (val) => formatStringValue(val) },
  { sourceField: 'unnamed_5', targetField: 'Property ID', transform: (val) => formatStringValue(val) },
  { sourceField: 'total_cost_fronted', targetField: 'Cost Fronted', transform: (val) => formatNumericValue(val) },
  { sourceField: 'total_costs', targetField: 'Total Costs', transform: (val) => formatNumericValue(val) },
  { sourceField: 'total_atty_fee', targetField: 'Attorney Fee', transform: (val) => formatNumericValue(val) },
  { sourceField: 'total_atty_fee_owed', targetField: 'Attorney Fee Owed', transform: (val) => formatNumericValue(val) },
  { sourceField: 'total_owed_w_fronted_costs', targetField: 'Total Owed', transform: (val) => formatNumericValue(val) },
  { sourceField: 'total_file_cost', targetField: 'File Cost', transform: (val) => formatNumericValue(val) },
  
  // New mappings for additional CSV headers
  { sourceField: 'file', targetField: 'File', transform: (val) => formatStringValue(val) },
  { sourceField: 'file id', targetField: 'File ID', transform: (val) => formatStringValue(val) },
  { sourceField: 'client', targetField: 'Client', transform: (val) => formatStringValue(val) },
  { sourceField: 'case_name', targetField: 'Case Name', transform: (val) => formatStringValue(val) },
  { sourceField: 'property_address', targetField: 'Property Address', transform: (val) => formatStringValue(val) },
  { sourceField: 'balance', targetField: 'Balance', transform: (val) => formatNumericValue(val) },
  { sourceField: 'filing_date', targetField: 'Filing Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'status', targetField: 'Status', transform: (val) => formatStringValue(val) },
  { sourceField: 'notes', targetField: 'Notes', transform: (val) => formatStringValue(val) },
  { sourceField: 'total_cost', targetField: 'Total Cost', transform: (val) => formatNumericValue(val) },
  { sourceField: 'attorney_fee', targetField: 'Attorney Fee', transform: (val) => formatNumericValue(val) },
  { sourceField: 'payment_status', targetField: 'Payment Status', transform: (val) => formatStringValue(val) }
];

// Custom mapping for summons files
const summonsMappings: FieldMapping[] = [
  { sourceField: 'caseid', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'defendent_name', targetField: 'Defendant 1', transform: (val) => formatStringValue(val) }, // Note: Fixed typo "defendent"
  { sourceField: 'service_method', targetField: 'Service Method', transform: (val) => formatStringValue(val) },
  { sourceField: 'service_date', targetField: 'Service Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'service_time', targetField: 'Service Time', transform: (val) => formatStringValue(val) },
  { sourceField: 'server_name', targetField: 'Server Name', transform: (val) => formatStringValue(val) }
];

// Custom mapping for court files (hearings)
const courtMappings: FieldMapping[] = [
  { sourceField: 'caseid', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'court_date', targetField: 'Court Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'court_time', targetField: 'Court Time', transform: (val) => formatStringValue(val) },
  { sourceField: 'court_room', targetField: 'Court Room', transform: (val) => formatStringValue(val) },
  { sourceField: 'judge', targetField: 'Judge', transform: (val) => formatStringValue(val) }
];

// Custom mapping for zoom links
const zoomMappings: FieldMapping[] = [
  { sourceField: 'caseid', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'meeting_id', targetField: 'Meeting ID', transform: (val) => formatStringValue(val) },
  { sourceField: 'password', targetField: 'Password', transform: (val) => formatStringValue(val) },
  { sourceField: 'join_link', targetField: 'Join Link', transform: (val) => formatStringValue(val) }
];

// Custom mapping for invoices
const invoiceMappings: FieldMapping[] = [
  { sourceField: 'caseid', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'invoice_no', targetField: 'Invoice Number', transform: (val) => formatStringValue(val) },
  { sourceField: 'invoice_date', targetField: 'Invoice Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'invoice_amount', targetField: 'Invoice Amount', transform: (val) => formatNumericValue(val) },
  { sourceField: 'payment_amount', targetField: 'Payment Amount', transform: (val) => formatNumericValue(val) },
  { sourceField: 'balance', targetField: 'Balance', transform: (val) => formatNumericValue(val) }
];

// Custom mapping for payment plans
const paymentPlanMappings: FieldMapping[] = [
  { sourceField: 'caseid', targetField: 'File #', transform: (val) => formatStringValue(val) },
  { sourceField: 'invoice_no', targetField: 'Invoice Number', transform: (val) => formatStringValue(val) },
  { sourceField: 'payment_date', targetField: 'Payment Date', transform: (val) => formatStringValue(val) },
  { sourceField: 'payment_amount', targetField: 'Payment Amount', transform: (val) => formatNumericValue(val) }
];

// Custom mapping for clients/contacts
const clientMappings: FieldMapping[] = [
  { sourceField: 'client_id', targetField: 'Client ID', transform: (val) => formatStringValue(val) },
  { sourceField: 'client_name', targetField: 'Client Name', transform: (val) => formatStringValue(val) },
  { sourceField: 'contact_name', targetField: 'Contact Name', transform: (val) => formatStringValue(val) },
  { sourceField: 'email', targetField: 'Email', transform: (val) => formatStringValue(val) },
  { sourceField: 'phone', targetField: 'Phone', transform: (val) => formatStringValue(val) },
  { sourceField: 'address', targetField: 'Address', transform: (val) => formatStringValue(val) }
];

// Map between customer's file names and our sheet name
const fileNameToSheetNameMapping: Record<string, string> = {
  'complaint_cleaned': 'Complaint',
  'complaints_cleaned': 'Complaint',
  'summons_cleaned': 'Summons',
  'sheriff_cleaned': 'SHERIFF',
  'sps_cleaned': 'SPS 25',
  'court_25_cleaned': 'Court 25',
  'court_24_cleaned': 'Court 24',
  'zoom_cleaned': 'ZOOM',
  'aff_of_serv_cleaned': 'Aff of Serv',
  'final_invoices_cleaned': 'Final Invoices',
  'outstanding_invoices_cleaned': 'Outstanding Invoices',
  'payment_plan_cleaned': 'Payment Plan',
  'pm_info_cleaned': 'PM INFO',
  // Add specific detection for the all_evictions_files_cleaned format
  'all_evictions_files_cleaned': 'ALL EVICTIONS FILES',
  'all_evictions': 'ALL EVICTIONS FILES',
  'evictions_files': 'ALL EVICTIONS FILES',
  'evictions': 'ALL EVICTIONS FILES',
  // Add new mappings for the additional CSV headers
  'case_data': 'ALL EVICTIONS FILES',
  'cases': 'ALL EVICTIONS FILES',
  'case_import': 'ALL EVICTIONS FILES',
  'client_cases': 'ALL EVICTIONS FILES',
  'full_case_data': 'ALL EVICTIONS FILES'
};

// Map between sheet names and their field mappings
const sheetToMappingMap: Record<string, FieldMapping[]> = {
  'Complaint': complaintMappings,
  'Summons': summonsMappings,
  'Court 25': courtMappings,
  'Court 24': courtMappings,
  'ZOOM': zoomMappings,
  'Final Invoices': invoiceMappings,
  'Outstanding Invoices': invoiceMappings,
  'Payment Plan': paymentPlanMappings,
  'PM INFO': clientMappings
};

/**
 * Transform a CSV row to match the expected format for our parsers
 * @param row The original CSV row with customer's fields
 * @param sheetName The target sheet name in our system
 * @returns A new row with the fields mapped to our expected format
 */
export function transformRow(row: any, sheetName: string): any {
  const mappings = sheetToMappingMap[sheetName];
  if (!mappings) {
    // If no mappings found, return the original row
    return row;
  }

  const transformedRow: any = {};
  
  // Apply all mappings for this sheet
  for (const mapping of mappings) {
    const sourceValue = row[mapping.sourceField];
    
    // Only process if the source field exists
    if (sourceValue !== undefined) {
      transformedRow[mapping.targetField] = mapping.transform 
        ? mapping.transform(sourceValue) 
        : sourceValue;
    }
  }
  
  // Include all other fields that might be needed but weren't explicitly mapped
  for (const key in row) {
    if (!mappings.some(m => m.sourceField === key) && row[key] !== undefined) {
      // Convert snake_case to Title Case for field names
      const titleCaseKey = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      transformedRow[titleCaseKey] = row[key];
    }
  }
  
  return transformedRow;
}

/**
 * Map a file name from the customer's format to our internal sheet name
 * @param fileName The customer's file name
 * @returns Our internal sheet name, or the original if no mapping exists
 */
export function mapCustomFileNameToSheetName(fileName: string): string {
  // Clean up the file name - remove path, extension, etc.
  const cleanName = fileName
    .replace(/^.*[\\\/]/, '') // Remove path
    .replace(/\.(csv|xlsx)$/i, '') // Remove extension
    .toLowerCase();
  
  // Find direct match first
  if (fileNameToSheetNameMapping[cleanName]) {
    return fileNameToSheetNameMapping[cleanName];
  }
  
  // Look for partial matches
  for (const [pattern, sheetName] of Object.entries(fileNameToSheetNameMapping)) {
    if (cleanName.includes(pattern) || pattern.includes(cleanName)) {
      return sheetName;
    }
  }
  
  // Fall back to existing mapFileNameToSheetName function in csvImporter.ts
  return cleanName;
}

/**
 * Transform all rows in a dataset to match our expected format
 * @param data The original data rows from customer CSV
 * @param sheetName The target sheet name in our system
 * @returns An array of transformed rows
 */
export function transformDataset(data: any[], sheetName: string): any[] {
  return data.map(row => transformRow(row, sheetName));
}

export default {
  transformRow,
  transformDataset,
  mapCustomFileNameToSheetName
};