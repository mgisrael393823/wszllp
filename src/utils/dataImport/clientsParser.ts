import { Contact } from '../../types/schema';
import { v4 as uuidv4 } from 'uuid';
import { 
  formatStringValue,
  formatAddress,
  isValidRow
} from './index';

/**
 * Parse client/contact data from the PM INFO sheet
 */
export function parseClients(pmData: any[]): Contact[] {
  const contacts: Contact[] = [];
  
  // Skip header row if it exists
  const startRow = Array.isArray(pmData) && pmData.length > 0 && 
    typeof pmData[0]['Company'] === 'string' && 
    pmData[0]['Company'].toLowerCase().includes('company') ? 1 : 0;
  
  for (let i = startRow; i < pmData.length; i++) {
    const row = pmData[i];
    
    // Check if row has company name
    if (!row || !row['Company']) {
      continue;
    }
    
    try {
      // Format company name
      const companyName = formatStringValue(row['Company']);
      if (!companyName) continue;
      
      // Determine role based on data
      let role: 'Attorney' | 'Paralegal' | 'PM' = 'PM'; // Default to Property Manager
      
      // Format phone
      let phone = formatStringValue(row['Company Main Phone'] || '');
      if (phone) {
        // Try to format as xxx-xxx-xxxx
        phone = phone.replace(/[^\d]/g, '');
        if (phone.length === 10) {
          phone = `${phone.substring(0, 3)}-${phone.substring(3, 6)}-${phone.substring(6)}`;
        }
      }
      
      // Format email
      const email = formatStringValue(row['E-mail Address'] || '');
      
      // Create contact object
      const contact: Contact = {
        contactId: uuidv4(),
        name: companyName,
        role: role,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      contacts.push(contact);
    } catch (error) {
      console.error(`Error parsing client row ${i}:`, error);
    }
  }
  
  return contacts;
}

/**
 * Extract client IDs from various sheets to build a client directory
 */
export function extractClientIds(
  allData: { sheetName: string, data: any[] }[]
): Set<string> {
  const clientIds = new Set<string>();
  
  for (const { sheetName, data } of allData) {
    // Skip empty sheets
    if (!Array.isArray(data) || data.length === 0) {
      continue;
    }
    
    // Look for client/file IDs
    for (const row of data) {
      // Skip empty rows
      if (!row) continue;
      
      // Common client ID fields
      const idFields = [
        'File #', 
        'Client No', 
        'Client ID', 
        'PM ID',
        'Company ID'
      ];
      
      for (const field of idFields) {
        if (row[field] && typeof row[field] === 'string') {
          const id = formatStringValue(row[field]);
          
          // Extract client prefix from IDs like "ABC123"
          const match = id.match(/^([A-Z]+)/);
          if (match && match[1]) {
            clientIds.add(match[1]);
          }
        }
      }
    }
  }
  
  return clientIds;
}

/**
 * Map client prefixes to full contact records
 */
export function mapClientPrefixesToContacts(
  clientPrefixes: Set<string>,
  contacts: Contact[]
): Map<string, string> {
  const clientMap = new Map<string, string>();
  
  // For each prefix, try to find matching contact
  for (const prefix of clientPrefixes) {
    let matchedContact: Contact | undefined;
    
    // Try to find exact match by comparing prefix to contact name initials
    for (const contact of contacts) {
      const words = contact.name.split(/\s+/);
      const initials = words.map(word => word[0]).join('');
      
      if (initials.toUpperCase() === prefix) {
        matchedContact = contact;
        break;
      }
      
      // Also check if the prefix is in the name
      if (contact.name.toUpperCase().includes(prefix)) {
        matchedContact = contact;
        break;
      }
    }
    
    // Map prefix to contact ID if found
    if (matchedContact) {
      clientMap.set(prefix, matchedContact.contactId);
    } else {
      // If no match found, just map to the prefix itself
      clientMap.set(prefix, prefix);
    }
  }
  
  return clientMap;
}

export default {
  parseClients,
  extractClientIds,
  mapClientPrefixesToContacts
};