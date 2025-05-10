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