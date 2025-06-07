import * as XLSX from 'xlsx';
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
    totalSheets: number;
    processedSheets: number;
    processedRows: number;
  };
}

/**
 * Import data from Excel files
 */
export async function importFromExcel(files: File[]): Promise<ImportResult> {
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
      totalSheets: 0,
      processedSheets: 0,
      processedRows: 0,
    }
  };
  
  try {
    console.log('Starting Excel import process...');
    
    // Extract all sheet data across all files
    const allSheets: { [key: string]: any[] } = {};
    
    // Process each Excel file
    for (const file of files) {
      try {
        console.log(`Processing Excel file: ${file.name}`);
        
        // Read the Excel file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log(`Excel file ${file.name} loaded. Sheets found:`, workbook.SheetNames);
        result.stats.totalSheets += workbook.SheetNames.length;
        
        // Process each sheet in the workbook
        for (const sheetName of workbook.SheetNames) {
          try {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
            
            console.log(`Sheet ${sheetName} has ${jsonData.length} rows`);
            
            // Transform the data using our field mapper
            const transformedData = csvFieldMapper.transformDataset(jsonData, sheetName);
            
            // If this sheet already exists from another file, append the data
            if (allSheets[sheetName]) {
              allSheets[sheetName] = [...allSheets[sheetName], ...transformedData];
            } else {
              allSheets[sheetName] = transformedData;
            }
            
            // Log a sample of the transformed data for debugging
            if (transformedData.length > 0) {
              console.log(`Sample transformed row from ${sheetName}:`, transformedData[0]);
            }
            
            result.stats.processedSheets++;
            result.stats.processedRows += jsonData.length;
          } catch (error) {
            result.warnings.push(`Error processing sheet ${sheetName} in file ${file.name}: ${error}`);
          }
        }
      } catch (error) {
        result.warnings.push(`Error processing Excel file ${file.name}: ${error}`);
      }
    }
    
    // Step 1: Parse clients/contacts from available sheets
    let allContactData: any[] = [];
    
    Object.keys(allSheets).forEach(sheetName => {
      const data = allSheets[sheetName] || [];
      if (data.length === 0) return;
      
      const lowerName = sheetName.toLowerCase();
      if (lowerName.includes('contact') || lowerName.includes('pm') || lowerName.includes('client')) {
        console.log(`Parsing contacts from ${sheetName}...`);
        allContactData = [...allContactData, ...data];
      }
    });
    
    result.entities.contacts = clientsParser.parseClients(allContactData);
    
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
    
    // Step 2: Parse cases from available sheets
    let allCases: any[] = [];
    
    // Look for case data in any available sheets
    Object.keys(allSheets).forEach(sheetName => {
      const data = allSheets[sheetName] || [];
      if (data.length === 0) return;
      
      console.log(`Checking ${sheetName} for case data...`);
      
      // Try to detect if this sheet contains case data
      const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase());
      const hasCaseData = headers.some(h => 
        h.includes('plaintiff') || h.includes('defendant') || h.includes('case')
      );
      
      if (hasCaseData) {
        console.log(`Parsing cases from ${sheetName}...`);
        if (sheetName.toLowerCase().includes('complaint')) {
          const cases = casesParser.parseCasesFromComplaint(data);
          allCases = [...allCases, ...cases];
        } else {
          const cases = casesParser.parseCasesFromAllEvictions(data);
          allCases = [...allCases, ...cases];
        }
      }
    });
    
    result.entities.cases = allCases;
    
    // Create a mapping of file ID to case ID for related entities
    const caseIdMapping = new Map<string, string>();
    result.entities.cases.forEach(caseObj => {
      if (caseObj.caseId) {
        caseIdMapping.set(caseObj.caseId, caseObj.caseId);
      }
    });
    
    // Step 3: Parse hearings from available sheets
    let allHearings: Hearing[] = [];
    
    // Look for hearing data in any available sheets
    Object.keys(allSheets).forEach(sheetName => {
      const data = allSheets[sheetName] || [];
      if (data.length === 0) return;
      
      // Try to detect if this sheet contains hearing data
      const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase());
      const hasHearingData = headers.some(h => 
        h.includes('court') || h.includes('hearing') || h.includes('date')
      );
      
      if (hasHearingData && (sheetName.toLowerCase().includes('court') || sheetName.toLowerCase().includes('hearing'))) {
        console.log(`Parsing hearings from ${sheetName}...`);
        const hearings = hearingsParser.parseHearingsFromCourtSheet(data, caseIdMapping);
        allHearings = [...allHearings, ...hearings];
      }
      
      // Handle zoom/video data separately
      if (sheetName.toLowerCase().includes('zoom') || sheetName.toLowerCase().includes('video')) {
        console.log(`Processing zoom data from ${sheetName}...`);
        const zoomData = hearingsParser.parseZoomData(data);
        // Merge with existing hearings
        allHearings = hearingsParser.mergeHearingsWithZoom(allHearings, zoomData);
      }
    });
    
    result.entities.hearings = allHearings;
    
    // Step 4: Parse documents from available sheets
    let complaintDocs: any[] = [];
    let summonsDocs: any[] = [];
    let otherDocs: any[] = [];
    
    Object.keys(allSheets).forEach(sheetName => {
      const data = allSheets[sheetName] || [];
      if (data.length === 0) return;
      
      const lowerName = sheetName.toLowerCase();
      if (lowerName.includes('complaint')) {
        console.log(`Parsing complaint documents from ${sheetName}...`);
        complaintDocs = [...complaintDocs, ...data];
      } else if (lowerName.includes('summons')) {
        console.log(`Parsing summons documents from ${sheetName}...`);
        summonsDocs = [...summonsDocs, ...data];
      } else if (lowerName.includes('document') || lowerName.includes('affidavit') || lowerName.includes('aff')) {
        console.log(`Parsing other documents from ${sheetName}...`);
        otherDocs = [...otherDocs, ...data];
      }
    });
    
    result.entities.documents = documentsParser.parseDocumentsFromSheets(
      complaintDocs,
      summonsDocs,
      otherDocs,
      caseIdMapping
    );
    
    // Step 5: Parse service logs from available sheets
    let spsData: any[] = [];
    let sheriffData: any[] = [];
    
    Object.keys(allSheets).forEach(sheetName => {
      const data = allSheets[sheetName] || [];
      if (data.length === 0) return;
      
      const lowerName = sheetName.toLowerCase();
      if (lowerName.includes('sps')) {
        console.log(`Parsing SPS service logs from ${sheetName}...`);
        spsData = [...spsData, ...data];
      } else if (lowerName.includes('sheriff')) {
        console.log(`Parsing Sheriff service logs from ${sheetName}...`);
        sheriffData = [...sheriffData, ...data];
      }
    });
    
    result.entities.serviceLogs = documentsParser.parseServiceLogs(
      spsData,
      sheriffData,
      result.entities.documents
    );
    
    // Step 6: Parse invoices from available sheets
    let outstandingInvoices: any[] = [];
    let newInvoices: any[] = [];
    let finalInvoices: any[] = [];
    let paymentPlans: any[] = [];
    
    Object.keys(allSheets).forEach(sheetName => {
      const data = allSheets[sheetName] || [];
      if (data.length === 0) return;
      
      const lowerName = sheetName.toLowerCase();
      if (lowerName.includes('invoice')) {
        console.log(`Parsing invoices from ${sheetName}...`);
        if (lowerName.includes('outstanding')) {
          outstandingInvoices = [...outstandingInvoices, ...data];
        } else if (lowerName.includes('new')) {
          newInvoices = [...newInvoices, ...data];
        } else if (lowerName.includes('final')) {
          finalInvoices = [...finalInvoices, ...data];
        } else {
          // Generic invoice data
          outstandingInvoices = [...outstandingInvoices, ...data];
        }
      } else if (lowerName.includes('payment') && lowerName.includes('plan')) {
        console.log(`Parsing payment plans from ${sheetName}...`);
        paymentPlans = [...paymentPlans, ...data];
      }
    });
    
    result.entities.invoices = invoicesParser.parseInvoices(
      outstandingInvoices,
      newInvoices,
      finalInvoices,
      caseIdMapping
    );
    
    // Step 7: Parse payment plans
    result.entities.paymentPlans = invoicesParser.parsePaymentPlans(
      paymentPlans,
      result.entities.invoices
    );
    
    // Log message if no cases were imported
    if (result.entities.cases.length === 0) {
      console.log('No cases found in import');
      result.warnings.push('No case data was found in the imported file.');
    }
    
    // Success!
    result.success = true;
    console.log('Import completed successfully with:', {
      cases: result.entities.cases.length,
      hearings: result.entities.hearings.length,
      documents: result.entities.documents.length,
      contacts: result.entities.contacts.length
    });
    
  } catch (error) {
    console.error('Import failed:', error);
    result.success = false;
    result.errors.push(`Import failed: ${error}`);
  }
  
  return result;
}

export default {
  importFromExcel
};