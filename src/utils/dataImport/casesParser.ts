import { Case } from '../../types/schema';
import { v4 as uuidv4 } from 'uuid';
import { 
  excelDateToISOString, 
  formatAddress, 
  determineCaseStatus,
  formatStringValue,
  formatNumericValue,
  isValidRow
} from './index';

/**
 * Parse case data from the Complaint sheet
 */
export function parseCasesFromComplaint(data: any[]): Case[] {
  const cases: Case[] = [];
  
  // Skip header row if it exists
  const startRow = Array.isArray(data) && data.length > 0 && 
    typeof data[0]['File #'] === 'string' && 
    data[0]['File #'].toLowerCase().includes('file') ? 1 : 0;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    // Check if row has the minimum required data
    if (!isValidRow(row, ['File #', 'Plaintiff 1', 'Defendant 1', 'Property Address'])) {
      continue;
    }
    
    try {
      // Create case object
      const caseObj: Case = {
        caseId: formatStringValue(row['File #']),
        plaintiff: formatStringValue(row['Plaintiff 1']),
        defendant: formatStringValue(row['Defendant 1']),
        address: formatAddress(
          formatStringValue(row['Property Address']),
          null, // Unit info might be included in address
          formatStringValue(row['City'] || 'Chicago'),
          formatStringValue(row['State'] || 'IL'),
          formatStringValue(row['Zip'] || '')
        ),
        status: determineCaseStatus(row),
        dateFiled: row['From Date'] ? 
          (typeof row['From Date'] === 'number' ? 
            excelDateToISOString(row['From Date']) : 
            new Date(row['From Date']).toISOString()) : 
          undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      cases.push(caseObj);
    } catch (error) {
      console.error(`Error parsing case row ${i}:`, error);
      // In a full implementation, we would track this error
    }
  }
  
  return cases;
}

/**
 * Parse case data from the ALL EVICTIONS FILES sheet
 * This requires more complex parsing as the sheet has varying formats
 */
export function parseCasesFromAllEvictions(data: any[]): Case[] {
  const cases: Case[] = [];
  
  // Find the actual header row (which has column titles like Case No, Case Name, etc.)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && (row['Case No'] || row['Client No'] || row['Case Name'])) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    // Only log error if there's actually data to process
    if (data.length > 0) {
      console.error('Could not find header row in case data');
    }
    return cases;
  }
  
  // Process rows after the header
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    // Check if row has client number and case name
    if (!row || !row['Client No'] || !row['Case Name']) {
      continue;
    }
    
    try {
      // Extract plaintiff and defendant from case name
      // Format is typically "Plaintiff v. Defendant"
      let plaintiff = '';
      let defendant = '';
      const caseName = formatStringValue(row['Case Name']);
      
      if (caseName.includes(' v. ')) {
        [plaintiff, defendant] = caseName.split(' v. ');
      } else if (caseName.includes(' vs. ')) {
        [plaintiff, defendant] = caseName.split(' vs. ');
      } else {
        plaintiff = caseName;
        defendant = 'Unknown Defendant';
      }
      
      // Create case object
      const caseObj: Case = {
        caseId: formatStringValue(row['Client No']),
        plaintiff: plaintiff.trim(),
        defendant: defendant.trim(),
        address: formatStringValue(row['Address'] || ''),
        status: determineCaseStatus(row),
        dateFiled: row['Date Filed'] ? 
          (typeof row['Date Filed'] === 'number' ? 
            excelDateToISOString(row['Date Filed']) : 
            new Date(row['Date Filed']).toISOString()) : 
          undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      cases.push(caseObj);
    } catch (error) {
      console.error(`Error parsing case row ${i}:`, error);
    }
  }
  
  return cases;
}

/**
 * Merge cases from multiple sources, removing duplicates
 */
export function mergeCases(casesList: Case[][]): Case[] {
  const caseMap = new Map<string, Case>();
  
  // Process each list of cases
  for (const cases of casesList) {
    for (const caseObj of cases) {
      if (caseObj.caseId) {
        // If case already exists, merge only if new data has more fields
        if (caseMap.has(caseObj.caseId)) {
          const existingCase = caseMap.get(caseObj.caseId)!;
          const mergedCase = mergeObjects(existingCase, caseObj);
          caseMap.set(caseObj.caseId, mergedCase);
        } else {
          caseMap.set(caseObj.caseId, caseObj);
        }
      }
    }
  }
  
  return Array.from(caseMap.values());
}

/**
 * Helper function to merge objects, preferring non-empty values
 */
function mergeObjects<T>(obj1: T, obj2: T): T {
  const result = { ...obj1 };
  
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      const value = obj2[key as keyof T];
      
      // Prefer non-empty values from obj2
      if (value !== undefined && value !== null && value !== '') {
        result[key as keyof T] = value;
      }
    }
  }
  
  return result;
}

export default {
  parseCasesFromComplaint,
  parseCasesFromAllEvictions,
  mergeCases
};