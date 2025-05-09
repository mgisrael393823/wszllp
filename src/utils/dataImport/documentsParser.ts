import { Document, ServiceLog } from '../../types/schema';
import { v4 as uuidv4 } from 'uuid';
import { 
  excelDateToISOString, 
  formatStringValue,
  isValidRow
} from './index';

/**
 * Parse document data from various document sheets
 */
export function parseDocumentsFromSheets(
  complaintData: any[], 
  summonsData: any[], 
  otherDocData: any[],
  caseMapping: Map<string, string>
): Document[] {
  const documents: Document[] = [];
  
  // Process documents from Complaint sheet
  documents.push(...parseDocumentsFromSource(
    complaintData, 
    'Complaint', 
    caseMapping
  ));
  
  // Process documents from Summons sheet
  documents.push(...parseDocumentsFromSource(
    summonsData, 
    'Summons', 
    caseMapping
  ));
  
  // Process other document types
  // This would be extended for other document types as needed
  
  return documents;
}

/**
 * Parse documents from a specific source sheet
 */
function parseDocumentsFromSource(
  data: any[], 
  documentType: string,
  caseMapping: Map<string, string>
): Document[] {
  const documents: Document[] = [];
  // Track unique file IDs to avoid duplicate documents
  const processedFileIds = new Set<string>();
  
  // Skip header rows
  let dataStartIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && (row['File #'] || row['Case #'])) {
      dataStartIndex = i + 1; // Start after header
      break;
    }
  }
  
  if (dataStartIndex === -1) {
    dataStartIndex = 0; // If no clear header, start from beginning
  }
  
  console.log(`Parsing ${documentType} documents, starting at row ${dataStartIndex}, total rows: ${data.length}`);
  
  // Process document rows
  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows or rows without file ID
    const fileId = row['File #'] || row['Case ID'] || '';
    if (!fileId) {
      continue;
    }
    
    try {
      // Skip instruction rows or summary rows that might have accidentally matched
      if (fileId.includes('INSTRUCTION') || fileId.includes('TOTAL') || 
          fileId.toLowerCase().includes('file') || fileId.toLowerCase().includes('note')) {
        continue;
      }
      
      // Create a unique document identifier by combining file ID and document type
      // This prevents creating multiple documents for the same case when there are
      // multiple defendants or variations listed in the spreadsheet
      const uniqueDocumentId = `${fileId}-${documentType}`;
      
      // Skip if we've already processed this document
      if (processedFileIds.has(uniqueDocumentId)) {
        continue;
      }
      
      // Find associated case ID
      let caseId = fileId;
      if (caseMapping.has(fileId)) {
        caseId = caseMapping.get(fileId) || fileId;
      }
      
      // Determine document status
      let status: 'Pending' | 'Served' | 'Failed' = 'Pending';
      
      if (row['Service Date'] || row['Date Served']) {
        status = 'Served';
      } else if (row['Failed'] || row['Failed Date']) {
        status = 'Failed';
      }
      
      // Determine file URL or name
      const fileURL = formatStringValue(row['File Name'] || `${documentType} - ${fileId}.pdf`);
      
      // Get service date if available
      let serviceDate: string | undefined;
      const serviceDateValue = row['Service Date'] || row['Date Served'];
      
      if (serviceDateValue) {
        if (typeof serviceDateValue === 'number') {
          serviceDate = excelDateToISOString(serviceDateValue);
        } else if (typeof serviceDateValue === 'string') {
          serviceDate = new Date(serviceDateValue).toISOString();
        } else if (serviceDateValue instanceof Date) {
          serviceDate = serviceDateValue.toISOString();
        }
      }
      
      // Create document object
      const document: Document = {
        docId: uuidv4(),
        caseId: caseId,
        type: documentType as any, // Cast to Document type enum
        fileURL: fileURL,
        status: status,
        serviceDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Mark this document as processed
      processedFileIds.add(uniqueDocumentId);
      
      documents.push(document);
    } catch (error) {
      console.error(`Error parsing document row ${i}:`, error);
    }
  }
  
  console.log(`Parsed ${documents.length} unique ${documentType} documents`);
  
  return documents;
}

/**
 * Parse service logs from SPS and Sheriff sheets
 */
export function parseServiceLogs(
  spsData: any[], 
  sheriffData: any[],
  documents: Document[]
): ServiceLog[] {
  const serviceLogs: ServiceLog[] = [];
  const docMap = new Map<string, Document>();
  
  // Create map of case ID to documents for quick lookup
  documents.forEach(doc => {
    if (!docMap.has(doc.caseId)) {
      docMap.set(doc.caseId, doc);
    }
  });
  
  // Process SPS service logs
  serviceLogs.push(...parseServiceLogsFromSource(
    spsData, 
    'SPS', 
    docMap
  ));
  
  // Process Sheriff service logs
  serviceLogs.push(...parseServiceLogsFromSource(
    sheriffData, 
    'Sheriff', 
    docMap
  ));
  
  return serviceLogs;
}

/**
 * Parse service logs from a specific source sheet
 */
function parseServiceLogsFromSource(
  data: any[], 
  method: 'Sheriff' | 'SPS',
  docMap: Map<string, Document>
): ServiceLog[] {
  const serviceLogs: ServiceLog[] = [];
  
  // Skip header rows
  let dataStartIndex = -1;
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (row && (row['File #'] || row['Case #'] || row['Case Name'])) {
      dataStartIndex = i + 1; // Start after header
      break;
    }
  }
  
  if (dataStartIndex === -1) {
    return serviceLogs; // No valid data found
  }
  
  // Process service log rows
  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows or rows without case identifier
    const fileId = row['File #'] || '';
    if (!fileId) {
      continue;
    }
    
    try {
      // Find associated document
      const document = docMap.get(fileId);
      if (!document) {
        continue; // Skip if no matching document
      }
      
      // Extract attempt date
      let attemptDate: string | undefined;
      const attemptDateValue = row['Attempt Date'] || row['Served Date'] || row['Filed Date'];
      
      if (attemptDateValue) {
        if (typeof attemptDateValue === 'number') {
          attemptDate = excelDateToISOString(attemptDateValue);
        } else if (typeof attemptDateValue === 'string') {
          attemptDate = new Date(attemptDateValue).toISOString();
        } else if (attemptDateValue instanceof Date) {
          attemptDate = attemptDateValue.toISOString();
        }
      }
      
      if (!attemptDate) {
        continue; // Skip if no attempt date
      }
      
      // Determine result
      let result: 'Success' | 'Failed' = 'Failed';
      
      if (row['Result'] === 'Success' || row['Served'] === 'Yes' || row['Status'] === 'Completed') {
        result = 'Success';
      }
      
      // Create service log object
      const serviceLog: ServiceLog = {
        logId: uuidv4(),
        docId: document.docId,
        method: method,
        attemptDate: attemptDate,
        result: result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      serviceLogs.push(serviceLog);
    } catch (error) {
      console.error(`Error parsing service log row ${i}:`, error);
    }
  }
  
  return serviceLogs;
}

export default {
  parseDocumentsFromSheets,
  parseServiceLogs
};