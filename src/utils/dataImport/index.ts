import { Case, Hearing, Document, Invoice, Contact } from '../../types/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data import utility for WSZLLP platform
 * Handles importing data from Excel spreadsheets
 */

interface ImportResult {
  success: boolean;
  entities: {
    cases: Case[];
    hearings: Hearing[];
    documents: Document[];
    invoices: Invoice[];
    contacts: Contact[];
  };
  errors: string[];
  warnings: string[];
}

// Convert Excel date (numeric) to ISO string
export function excelDateToISOString(excelDate: number): string {
  // Excel dates are number of days since 1/1/1900
  // 25569 is the number of days between 1/1/1900 and 1/1/1970 (Unix epoch)
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const date = new Date((excelDate - 25569) * millisecondsPerDay);
  return date.toISOString();
}

// Format address components into a single string
export function formatAddress(
  street: string, 
  unit: string | null = null, 
  city: string, 
  state: string, 
  zip: string | number
): string {
  let address = street;
  if (unit) address += `, ${unit}`;
  address += `, ${city}, ${state} ${zip}`;
  return address;
}

// Determine case status based on various fields
export function determineCaseStatus(row: any): 'Intake' | 'Active' | 'Closed' {
  // Logic to determine case status based on available data
  // This would need to be customized based on actual data patterns
  if (row['Outcome'] === 'Closed' || row['Status'] === 'Closed') {
    return 'Closed';
  } else if (row['Court Date'] || row['Hearing Date']) {
    return 'Active';
  } else {
    return 'Intake';
  }
}

// Format a string value to make it consistent
export function formatStringValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Format a numeric value to ensure it's a number
export function formatNumericValue(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  // Try to parse as number
  const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

// Check if a row has enough data to be valid
export function isValidRow(row: any, requiredFields: string[]): boolean {
  if (!row) return false;
  
  for (const field of requiredFields) {
    if (row[field] === undefined || row[field] === null || row[field] === '') {
      return false;
    }
  }
  
  return true;
}

/**
 * Main function to process imported Excel data
 * Currently a stub for the actual implementation
 */
export async function processImportedData(data: any[]): Promise<ImportResult> {
  // This would be expanded for the actual implementation
  
  const result: ImportResult = {
    success: true,
    entities: {
      cases: [],
      hearings: [],
      documents: [],
      invoices: [],
      contacts: [],
    },
    errors: [],
    warnings: [],
  };

  try {
    // Processing would happen here
    // For now, just return an empty successful result
  } catch (error) {
    result.success = false;
    result.errors.push(`Import error: ${error}`);
  }

  return result;
}

export default {
  processImportedData,
  excelDateToISOString,
  formatAddress,
  determineCaseStatus,
  formatStringValue,
  formatNumericValue,
  isValidRow,
};