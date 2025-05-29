import { Invoice, PaymentPlan } from '../../types/schema';
import { v4 as uuidv4 } from 'uuid';
import { 
  excelDateToISOString, 
  formatStringValue,
  formatNumericValue,
  isValidRow
} from './index';

/**
 * Parse invoice data from invoice sheets
 */
export function parseInvoices(
  outstandingInvoices: any[],
  newInvoices: any[],
  finalInvoices: any[],
  caseMapping: Map<string, string>
): Invoice[] {
  const invoices: Invoice[] = [];
  const invoiceMap = new Map<string, Invoice>();
  
  // Process invoices from each source
  const sources = [
    { data: outstandingInvoices, name: 'Outstanding Invoices' },
    { data: newInvoices, name: 'New Invoice List' },
    { data: finalInvoices, name: 'Final Invoices' }
  ];
  
  for (const source of sources) {
    const parsedInvoices = parseInvoicesFromSource(
      source.data,
      source.name,
      caseMapping
    );
    
    // Merge invoices to avoid duplicates
    for (const invoice of parsedInvoices) {
      if (invoice.invoiceId && !invoiceMap.has(invoice.invoiceId)) {
        invoiceMap.set(invoice.invoiceId, invoice);
      }
    }
  }
  
  return Array.from(invoiceMap.values());
}

/**
 * Parse invoices from a specific source sheet
 */
function parseInvoicesFromSource(
  data: any[],
  sourceName: string,
  caseMapping: Map<string, string>
): Invoice[] {
  const invoices: Invoice[] = [];
  
  // Find the header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && 
        (row['File #'] !== undefined || row['Inv #'] !== undefined || row['Invoice #'] !== undefined)) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    // Only log error if there's actually data to process
    if (data.length > 0) {
      console.error(`Could not find header row in ${sourceName}`);
    }
    return invoices;
  }
  
  // Process invoice rows
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row) continue;
    
    // Get file/case identifier
    const fileId = formatStringValue(row['File #'] || '');
    if (!fileId) continue;
    
    try {
      // Find associated case ID
      let caseId = fileId;
      if (caseMapping.has(fileId)) {
        caseId = caseMapping.get(fileId) || fileId;
      }
      
      // Get invoice number
      const invoiceId = formatStringValue(row['Inv #'] || row['Invoice #'] || '');
      if (!invoiceId) continue;
      
      // Get amount
      let amount = 0;
      
      // Try different column names for amount
      const amountValue = row['Amount'] || row['Total'] || row['Invoice Amount'];
      amount = formatNumericValue(amountValue);
      
      // Get issue date
      let issueDate = new Date().toISOString();
      const issueDateValue = row['Issue Date'] || row['Date'] || row['Invoice Date'];
      
      if (issueDateValue) {
        if (typeof issueDateValue === 'number') {
          issueDate = excelDateToISOString(issueDateValue);
        } else if (typeof issueDateValue === 'string') {
          try {
            issueDate = new Date(issueDateValue).toISOString();
          } catch (e) {
            // Keep default
          }
        } else if (issueDateValue instanceof Date) {
          issueDate = issueDateValue.toISOString();
        }
      }
      
      // Get due date (default to 30 days after issue)
      let dueDate = new Date(new Date(issueDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const dueDateValue = row['Due Date'] || row['Due'];
      
      if (dueDateValue) {
        if (typeof dueDateValue === 'number') {
          dueDate = excelDateToISOString(dueDateValue);
        } else if (typeof dueDateValue === 'string') {
          try {
            dueDate = new Date(dueDateValue).toISOString();
          } catch (e) {
            // Keep default
          }
        } else if (dueDateValue instanceof Date) {
          dueDate = dueDateValue.toISOString();
        }
      }
      
      // Determine if paid
      const paidValue = row['Paid'] || row['Status'];
      let paid = false;
      
      if (paidValue !== undefined) {
        if (typeof paidValue === 'boolean') {
          paid = paidValue;
        } else if (typeof paidValue === 'string') {
          paid = paidValue.toLowerCase() === 'paid' || 
                paidValue.toLowerCase() === 'yes' || 
                paidValue.toLowerCase() === 'complete';
        } else if (typeof paidValue === 'number') {
          paid = paidValue === 1;
        }
      }
      
      // Create invoice object
      const invoice: Invoice = {
        invoiceId: invoiceId,
        caseId: caseId,
        amount: amount,
        issueDate: issueDate,
        dueDate: dueDate,
        paid: paid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      invoices.push(invoice);
    } catch (error) {
      console.error(`Error parsing invoice row ${i} from ${sourceName}:`, error);
    }
  }
  
  return invoices;
}

/**
 * Parse payment plans from the Payment Plan sheet
 */
export function parsePaymentPlans(
  paymentPlanData: any[],
  invoices: Invoice[]
): PaymentPlan[] {
  const paymentPlans: PaymentPlan[] = [];
  const invoiceMap = new Map<string, Invoice>();
  
  // Create map of case ID to invoice for quick lookup
  invoices.forEach(invoice => {
    invoiceMap.set(invoice.invoiceId, invoice);
  });
  
  // Find the relevant data in the payment plan sheet
  // This is highly dependent on the specific format of the payment plan sheet
  
  // Example parsing logic - would need to be customized
  for (let i = 0; i < paymentPlanData.length; i++) {
    const row = paymentPlanData[i];
    
    // Check if row has relevant data
    if (!row || !row['EXHIBIT 1']) continue;
    
    // Try to find case or invoice reference
    let invoiceId = '';
    if (row['Case #']) {
      const caseNumber = formatStringValue(row['Case #']);
      // Find invoice for this case
      for (const [id, invoice] of invoiceMap.entries()) {
        if (invoice.caseId.includes(caseNumber)) {
          invoiceId = id;
          break;
        }
      }
    }
    
    if (!invoiceId) continue;
    
    // Extract payment date
    let installmentDate = new Date().toISOString();
    const dateValue = row['Payment Date'] || row['Date'];
    
    if (dateValue) {
      if (typeof dateValue === 'number') {
        installmentDate = excelDateToISOString(dateValue);
      } else if (typeof dateValue === 'string') {
        try {
          installmentDate = new Date(dateValue).toISOString();
        } catch (e) {
          // Keep default
        }
      } else if (dateValue instanceof Date) {
        installmentDate = dateValue.toISOString();
      }
    }
    
    // Extract payment amount
    const amountValue = row['Payment'] || row['Amount'] || row['Monthly Payment'];
    const amount = formatNumericValue(amountValue);
    
    if (amount <= 0) continue;
    
    // Determine if paid
    const paidValue = row['Paid'] || row['Status'];
    let paid = false;
    
    if (paidValue !== undefined) {
      if (typeof paidValue === 'boolean') {
        paid = paidValue;
      } else if (typeof paidValue === 'string') {
        paid = paidValue.toLowerCase() === 'paid' || 
              paidValue.toLowerCase() === 'yes' || 
              paidValue.toLowerCase() === 'complete';
      } else if (typeof paidValue === 'number') {
        paid = paidValue === 1;
      }
    }
    
    // Create payment plan object
    const paymentPlan: PaymentPlan = {
      planId: uuidv4(),
      invoiceId: invoiceId,
      installmentDate: installmentDate,
      amount: amount,
      paid: paid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    paymentPlans.push(paymentPlan);
  }
  
  return paymentPlans;
}

export default {
  parseInvoices,
  parsePaymentPlans
};