import { Hearing } from '../../types/schema';
import { v4 as uuidv4 } from 'uuid';
import { 
  excelDateToISOString, 
  formatStringValue,
  isValidRow
} from './index';

/**
 * Parse hearing data from Court sheets
 */
export function parseHearingsFromCourtSheet(data: any[], caseMapping: Map<string, string>): Hearing[] {
  const hearings: Hearing[] = [];
  
  // Find the actual data rows (skip headers)
  let dataStartIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && (row['File #'] || row['Case #'] || row['Case No'])) {
      dataStartIndex = i + 1; // Start after header
      break;
    }
  }
  
  if (dataStartIndex === -1) {
    dataStartIndex = 0; // If no clear header, start from beginning
  }
  
  // Process data rows
  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows or rows without case identifier
    const fileId = row['File #'] || row['Case ID'] || '';
    if (!fileId) {
      continue;
    }
    
    try {
      // Find associated case ID
      let caseId = fileId;
      if (caseMapping.has(fileId)) {
        caseId = caseMapping.get(fileId) || fileId;
      }
      
      // Extract court date and time
      let hearingDate = null;
      const dateCols = ['Court Date', 'Hearing Date', 'Date', 'Next Court Date'];
      
      for (const col of dateCols) {
        if (row[col]) {
          hearingDate = row[col];
          break;
        }
      }
      
      if (!hearingDate) {
        continue; // Skip if no hearing date
      }
      
      // Format hearing date
      let hearingDateIso: string;
      if (typeof hearingDate === 'number') {
        hearingDateIso = excelDateToISOString(hearingDate);
      } else if (typeof hearingDate === 'string') {
        // Try to parse date string
        hearingDateIso = new Date(hearingDate).toISOString();
      } else if (hearingDate instanceof Date) {
        hearingDateIso = hearingDate.toISOString();
      } else {
        continue; // Skip if invalid date
      }
      
      // Extract court name
      const courtName = formatStringValue(row['Courtroom'] || row['Court'] || 'Unknown Court');
      
      // Create hearing object
      const hearing: Hearing = {
        hearingId: uuidv4(),
        caseId: caseId,
        courtName: courtName,
        hearingDate: hearingDateIso,
        outcome: formatStringValue(row['Outcome'] || row['Result'] || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      hearings.push(hearing);
    } catch (error) {
      console.error(`Error parsing hearing row ${i}:`, error);
    }
  }
  
  return hearings;
}

/**
 * Parse ZOOM information to augment hearing data
 */
export function parseZoomData(data: any[]): Map<string, { meetingId?: string, password?: string, judge?: string }> {
  const zoomMap = new Map<string, { meetingId?: string, password?: string, judge?: string }>();
  
  // Skip header rows
  let dataStartIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row['Courtroom'] && (row['Meeting ID'] !== undefined || row['Password'] !== undefined)) {
      dataStartIndex = i;
      break;
    }
  }
  
  if (dataStartIndex === -1) {
    return zoomMap; // No valid data found
  }
  
  // Process zoom data
  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    
    if (!row || !row['Courtroom']) {
      continue;
    }
    
    const courtroom = formatStringValue(row['Courtroom']);
    if (!courtroom) continue;
    
    zoomMap.set(courtroom, {
      meetingId: row['Meeting ID'] ? formatStringValue(row['Meeting ID']) : undefined,
      password: row['Password'] ? formatStringValue(row['Password']) : undefined,
      judge: row['Judge'] ? formatStringValue(row['Judge']) : undefined,
    });
  }
  
  return zoomMap;
}

/**
 * Merge hearing data with zoom information
 */
export function mergeHearingsWithZoom(
  hearings: Hearing[],
  zoomMap: Map<string, { meetingId?: string, password?: string, judge?: string }>
): Hearing[] {
  return hearings.map(hearing => {
    const courtName = hearing.courtName;
    const zoomInfo = zoomMap.get(courtName);
    
    if (zoomInfo) {
      // Add zoom info to hearing's outcome field
      let outcome = hearing.outcome || '';
      
      if (zoomInfo.meetingId || zoomInfo.password) {
        outcome += outcome ? ' | ' : '';
        outcome += `Zoom: ${zoomInfo.meetingId || 'No ID'}`;
        
        if (zoomInfo.password) {
          outcome += `, Pwd: ${zoomInfo.password}`;
        }
      }
      
      if (zoomInfo.judge) {
        outcome += outcome ? ' | ' : '';
        outcome += `Judge: ${zoomInfo.judge}`;
      }
      
      return {
        ...hearing,
        outcome
      };
    }
    
    return hearing;
  });
}

export default {
  parseHearingsFromCourtSheet,
  parseZoomData,
  mergeHearingsWithZoom
};