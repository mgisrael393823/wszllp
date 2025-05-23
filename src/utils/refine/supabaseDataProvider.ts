import { DataProvider, BaseRecord } from "@refinedev/core";
import { supabase } from '../../lib/supabaseClient';

// Type definitions for our Supabase contacts
export interface SupabaseContact extends BaseRecord {
  id: string;
  name: string;
  role: 'Attorney' | 'Paralegal' | 'PM' | 'Client' | 'Other';
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseContact extends BaseRecord {
  id: string;
  case_id: string;
  contact_id: string;
  relationship_type: 'Plaintiff' | 'Defendant' | 'Attorney' | 'Paralegal' | 'Property Manager' | 'Witness' | 'Expert' | 'Court Reporter' | 'Other';
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  contact?: SupabaseContact;
  case?: any; // Will be typed when we migrate cases
}

export interface ContactCommunication extends BaseRecord {
  id: string;
  contact_id: string;
  case_id?: string;
  communication_type: 'Email' | 'Phone Call' | 'Meeting' | 'Letter' | 'Text Message' | 'Video Call' | 'Other';
  subject?: string;
  content: string;
  direction: 'Incoming' | 'Outgoing';
  communication_date: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Create Supabase-based data provider
export const createSupabaseDataProvider = (): DataProvider => ({
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    let query = supabase.from(resource).select('*', { count: 'exact' });

    // Handle resource-specific joins
    if (resource === 'case_contacts') {
      query = supabase
        .from('case_contacts')
        .select(`
          *,
          contact:contacts(*),
          case:cases(*)
        `, { count: 'exact' });
    } else if (resource === 'contact_communications') {
      query = supabase
        .from('contact_communications')
        .select(`
          *,
          contact:contacts(*),
          case:cases(*)
        `, { count: 'exact' });
    }

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        const { field, operator, value } = filter;
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'ne':
            query = query.neq(field, value);
            break;
          case 'lt':
            query = query.lt(field, value);
            break;
          case 'lte':
            query = query.lte(field, value);
            break;
          case 'gt':
            query = query.gt(field, value);
            break;
          case 'gte':
            query = query.gte(field, value);
            break;
          case 'in':
            query = query.in(field, value);
            break;
          case 'contains':
            query = query.ilike(field, `%${value}%`);
            break;
          case 'containss':
            query = query.like(field, `%${value}%`);
            break;
          case 'null':
            query = query.is(field, null);
            break;
          case 'nnull':
            query = query.not(field, 'is', null);
            break;
          default:
            break;
        }
      });
    }

    // Apply sorting
    if (sorters && sorters.length > 0) {
      sorters.forEach((sorter) => {
        const { field, order } = sorter;
        query = query.order(field, { ascending: order === 'asc' });
      });
    } else {
      // Default sorting by created_at desc
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      const from = (current - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${resource}: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  },

  getOne: async ({ resource, id, meta }) => {
    let query = supabase.from(resource).select('*').eq('id', id).single();

    // Handle resource-specific joins
    if (resource === 'case_contacts') {
      query = supabase
        .from('case_contacts')
        .select(`
          *,
          contact:contacts(*),
          case:cases(*)
        `)
        .eq('id', id)
        .single();
    } else if (resource === 'contact_communications') {
      query = supabase
        .from('contact_communications')
        .select(`
          *,
          contact:contacts(*),
          case:cases(*)
        `)
        .eq('id', id)
        .single();
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${resource} with id ${id}: ${error.message}`);
    }

    return {
      data: data || {},
    };
  },

  create: async ({ resource, variables, meta }) => {
    // Handle special field mappings for backwards compatibility
    let insertData = { ...variables };
    
    if (resource === 'contacts') {
      // Map contactId to id if present (for backwards compatibility)
      if (variables.contactId) {
        delete insertData.contactId;
      }
      // Remove any fields that don't exist in the database
      delete insertData.createdAt;
      delete insertData.updatedAt;
    }

    const { data, error } = await supabase
      .from(resource)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${resource}: ${error.message}`);
    }

    return {
      data: data || {},
    };
  },

  update: async ({ resource, id, variables, meta }) => {
    // Handle special field mappings
    let updateData = { ...variables };
    
    if (resource === 'contacts') {
      // Remove fields that shouldn't be updated
      delete updateData.contactId;
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.created_at;
      delete updateData.updated_at;
    }

    const { data, error } = await supabase
      .from(resource)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${resource} with id ${id}: ${error.message}`);
    }

    return {
      data: data || {},
    };
  },

  deleteOne: async ({ resource, id, meta }) => {
    const { data, error } = await supabase
      .from(resource)
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete ${resource} with id ${id}: ${error.message}`);
    }

    return {
      data: data || {},
    };
  },

  getApiUrl: () => {
    return supabase.supabaseUrl;
  },

  custom: async ({ url, method, filters, sorters, payload, query, headers, meta }) => {
    // Handle custom operations like bulk operations, complex queries, etc.
    throw new Error("Custom method not implemented yet");
  },
});

// Helper functions for common operations
export const contactQueries = {
  // Get contacts for a specific case
  getContactsForCase: async (caseId: string) => {
    const { data, error } = await supabase
      .from('case_contacts')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('case_id', caseId)
      .order('relationship_type');

    if (error) {
      throw new Error(`Failed to fetch contacts for case ${caseId}: ${error.message}`);
    }

    return data || [];
  },

  // Get cases for a specific contact
  getCasesForContact: async (contactId: string) => {
    const { data, error } = await supabase
      .from('case_contacts')
      .select(`
        *,
        case:cases(*)
      `)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cases for contact ${contactId}: ${error.message}`);
    }

    return data || [];
  },

  // Get communication history for a contact
  getCommunicationHistory: async (contactId: string, caseId?: string) => {
    let query = supabase
      .from('contact_communications')
      .select(`
        *,
        case:cases(plaintiff, defendant)
      `)
      .eq('contact_id', contactId)
      .order('communication_date', { ascending: false });

    if (caseId) {
      query = query.eq('case_id', caseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch communication history: ${error.message}`);
    }

    return data || [];
  },

  // Add a contact to a case
  addContactToCase: async (caseId: string, contactId: string, relationshipType: string, isPrimary = false, notes?: string) => {
    const { data, error } = await supabase
      .from('case_contacts')
      .insert({
        case_id: caseId,
        contact_id: contactId,
        relationship_type: relationshipType,
        is_primary: isPrimary,
        notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link contact to case: ${error.message}`);
    }

    return data;
  },

  // Log communication with a contact
  logCommunication: async (communication: Omit<ContactCommunication, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('contact_communications')
      .insert(communication)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log communication: ${error.message}`);
    }

    return data;
  },
};