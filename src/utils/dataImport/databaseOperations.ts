import { supabase } from '../../lib/supabaseClient';
import { validateEmailField } from './fieldDetector';

// Database operation results interface
interface SaveResult {
  success: boolean;
  saved: number;
  errors?: string[];
}

/**
 * Save contacts to Supabase with proper user association
 */
export const saveContactsToSupabase = async (contacts: any[]): Promise<SaveResult> => {
  if (contacts.length === 0) {
    return { success: true, saved: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Transform contacts to match Supabase schema
  // Remove duplicates by email
  const seen = new Set<string>();

  const supabaseContacts = contacts.map(contact => ({
    name: contact.name || 'Unknown Contact',
    role: contact.role || 'Other',
    email: contact.email || '',
    phone: contact.phone || null,
    company: contact.company || null,
    address: contact.address || contact.contactAddress || null,
    city: contact.city || null,
    state: contact.state || null,
    zip_code: contact.zipCode || null,
    notes: contact.notes || null,
    user_id: userId || null
  }));

  const filteredContacts = supabaseContacts.filter(c => {
    const email = c.email || '';
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  const emailCheck = validateEmailField(filteredContacts.map(c => c.email));
  if (!emailCheck.isValid) {
    console.warn('Invalid emails detected during saveContacts:', emailCheck.invalidCount);
  }

  const { data, error } = await supabase
    .from('contacts')
    .upsert(filteredContacts, {
      onConflict: 'email',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { 
      success: false, 
      saved: 0, 
      errors: [error.message] 
    };
  }

  return { 
    success: true, 
    saved: data?.length || 0 
  };
};

/**
 * Save cases to Supabase
 */
export const saveCasesToSupabase = async (cases: any[]): Promise<SaveResult> => {
  if (cases.length === 0) {
    return { success: true, saved: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const supabaseCases = cases.map(caseItem => ({
    case_number: caseItem.caseNumber || caseItem.caseId,
    case_name: caseItem.caseName || `${caseItem.plaintiff || 'Unknown'} v ${caseItem.defendant || 'Unknown'}`,
    client_name: caseItem.clientName || caseItem.plaintiff,
    client_type: caseItem.clientType || 'Individual',
    status: caseItem.status || 'Active',
    property_address: caseItem.propertyAddress || caseItem.address,
    filing_date: caseItem.filingDate || new Date().toISOString(),
    plaintiff: caseItem.plaintiff,
    defendant: caseItem.defendant,
    user_id: userId || null
  }));

  const { data, error } = await supabase
    .from('cases')
    .upsert(supabaseCases, {
      onConflict: 'case_number',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { 
      success: false, 
      saved: 0, 
      errors: [error.message] 
    };
  }

  return { 
    success: true, 
    saved: data?.length || 0 
  };
};

/**
 * Save hearings to Supabase
 */
export const saveHearingsToSupabase = async (hearings: any[]): Promise<SaveResult> => {
  if (hearings.length === 0) {
    return { success: true, saved: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const supabaseHearings = hearings.map(hearing => ({
    case_id: hearing.caseId,
    hearing_date: hearing.hearingDate || hearing.date,
    hearing_type: hearing.hearingType || 'Status Conference',
    location: hearing.location || hearing.courtName,
    notes: hearing.notes || hearing.outcome,
    user_id: userId || null
  }));

  const { data, error } = await supabase
    .from('hearings')
    .insert(supabaseHearings)
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { 
      success: false, 
      saved: 0, 
      errors: [error.message] 
    };
  }

  return { 
    success: true, 
    saved: data?.length || 0 
  };
};

/**
 * Save documents to Supabase
 */
export const saveDocumentsToSupabase = async (documents: any[]): Promise<SaveResult> => {
  if (documents.length === 0) {
    return { success: true, saved: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const supabaseDocuments = documents.map(doc => ({
    case_id: doc.caseId,
    title: doc.title || doc.name || 'Untitled Document',
    type: doc.type || doc.documentType || 'Other',
    file_path: doc.filePath || doc.url || '',
    uploaded_at: doc.uploadedAt || new Date().toISOString(),
    original_filename: doc.originalFilename || doc.fileName,
    user_id: userId || null
  }));

  const { data, error } = await supabase
    .from('documents')
    .insert(supabaseDocuments)
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { 
      success: false, 
      saved: 0, 
      errors: [error.message] 
    };
  }

  return { 
    success: true, 
    saved: data?.length || 0 
  };
};

/**
 * Batch save all entities to Supabase
 */
export const saveAllEntitiesToSupabase = async (entities: {
  cases: any[];
  contacts: any[];
  hearings: any[];
  documents: any[];
}): Promise<{
  cases: SaveResult;
  contacts: SaveResult;
  hearings: SaveResult;
  documents: SaveResult;
}> => {
  const results = await Promise.all([
    saveCasesToSupabase(entities.cases),
    saveContactsToSupabase(entities.contacts),
    saveHearingsToSupabase(entities.hearings),
    saveDocumentsToSupabase(entities.documents)
  ]);

  return {
    cases: results[0],
    contacts: results[1],
    hearings: results[2],
    documents: results[3]
  };
};