import * as XLSX from 'xlsx';
import { Case, Hearing, Document, Invoice, PaymentPlan, Contact, ServiceLog } from '../../types/schema';
import casesParser from './casesParser';
import hearingsParser from './hearingsParser';
import documentsParser from './documentsParser';
import invoicesParser from './invoicesParser';
import clientsParser from './clientsParser';

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
 * Import data from Excel file
 */
export async function importFromExcel(file: File): Promise<ImportResult> {
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
    // Read the Excel file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    result.stats.totalSheets = workbook.SheetNames.length;
    
    // Extract all sheet data
    const allSheets: { [key: string]: any[] } = {};
    for (const sheetName of workbook.SheetNames) {
      try {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        
        allSheets[sheetName] = jsonData;
        result.stats.processedSheets++;
        result.stats.processedRows += jsonData.length;
      } catch (error) {
        result.warnings.push(`Error processing sheet ${sheetName}: ${error}`);
      }
    }
    
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
    
    // Success!
    result.success = true;
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Import failed: ${error}`);
  }
  
  return result;
}

export default {
  importFromExcel
};