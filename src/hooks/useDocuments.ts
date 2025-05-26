import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Document } from '../types/schema';

interface DocumentWithCase extends Document {
  case: {
    plaintiff: string;
    defendant: string;
  };
}

interface DocumentFilters {
  type?: string;
  status?: string;
  searchTerm?: string;
  caseId?: string;
}

export function useDocuments(limit?: number, filters?: DocumentFilters, page: number = 1, itemsPerPage: number = 10) {
  const [documents, setDocuments] = useState<DocumentWithCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Start building query - try to select original_filename if it exists
        let query = supabase
          .from('documents')
          .select('*', { count: 'exact' });
        
        // Apply filters if provided
        if (filters) {
          if (filters.type && filters.type !== '') {
            query = query.eq('type', filters.type);
          }
          
          if (filters.status && filters.status !== '') {
            query = query.eq('status', filters.status);
          }
          
          if (filters.caseId && filters.caseId !== '') {
            query = query.eq('case_id', filters.caseId);
          }
          
          // Note: We'll handle search filtering after fetching case data to include case fields
        }
        
        // Apply pagination if not using limit
        if (!limit) {
          const start = (page - 1) * itemsPerPage;
          query = query.range(start, start + itemsPerPage - 1);
        } else {
          // Apply limit if provided
          query = query.limit(limit);
        }
        
        // Order by creation date, newest first
        query = query.order('created_at', { ascending: false });
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Fetch case information for each document
        const formattedDocuments: DocumentWithCase[] = [];
        
        if (data && data.length > 0) {
          // Get unique case IDs
          const caseIds = [...new Set(data.map(doc => doc.case_id).filter(Boolean))];
          
          // Fetch all relevant cases in a single query
          let casesMap: Record<string, { id: string; plaintiff: string; defendant: string }> = {};
          
          if (caseIds.length > 0) {
            const { data: casesData, error: casesError } = await supabase
              .from('cases')
              .select('id, plaintiff, defendant')
              .in('id', caseIds);
              
            if (casesError) throw casesError;
            
            // Create a map of case data for quick lookup
            casesMap = (casesData || []).reduce((acc: Record<string, { id: string; plaintiff: string; defendant: string }>, caseItem) => {
              acc[caseItem.id] = caseItem;
              return acc;
            }, {});
          }
          
          // Format the documents with case data
          for (const doc of data) {
            const caseData = casesMap[doc.case_id];
            
            const formattedDoc = {
              docId: doc.id,
              caseId: doc.case_id,
              type: doc.type,
              fileURL: doc.file_url || doc.fileURL, // Handle both snake_case and camelCase
              originalFilename: doc.original_filename,
              status: doc.status,
              serviceDate: doc.service_date,
              createdAt: doc.created_at,
              updatedAt: doc.updated_at,
              case: caseData ? {
                plaintiff: caseData.plaintiff,
                defendant: caseData.defendant
              } : {
                plaintiff: 'Unknown',
                defendant: 'Unknown'
              }
            };
            
            formattedDocuments.push(formattedDoc);
          }
        }
        
        // Apply search filtering to final results if needed
        let finalDocuments = formattedDocuments;
        if (filters?.searchTerm && filters.searchTerm !== '') {
          const searchLower = filters.searchTerm.toLowerCase();
          finalDocuments = formattedDocuments.filter(doc => {
            const matchesCase = 
              doc.case.plaintiff.toLowerCase().includes(searchLower) ||
              doc.case.defendant.toLowerCase().includes(searchLower);
            const matchesDoc = 
              doc.type.toLowerCase().includes(searchLower) ||
              doc.status.toLowerCase().includes(searchLower) ||
              doc.fileURL.toLowerCase().includes(searchLower);
            return matchesCase || matchesDoc;
          });
        }
        
        setDocuments(finalDocuments);
        setTotalCount(finalDocuments.length);
      } catch (err) {
        console.error('❌ useDocuments error:', err);
        if (err instanceof Error) {
          console.error('   message:', err.message);
          const supabaseError = err as Error & { details?: string; hint?: string; code?: string };
          console.error('   details:', supabaseError.details || 'no details');
          console.error('   hint:', supabaseError.hint || 'no hint');
          console.error('   code:', supabaseError.code || 'no code');
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocuments();
  }, [limit, filters, page, itemsPerPage]);
  
  return { documents, isLoading, error, totalCount };
}

export async function createDocument(document: Omit<Document, 'docId' | 'createdAt' | 'updatedAt'> & { originalFilename?: string }) {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('documents')
      .insert({
        case_id: document.caseId,
        type: document.type,
        file_url: document.fileURL,
        status: document.status,
        service_date: document.serviceDate || null,
        original_filename: document.originalFilename || null,
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    return { id: data?.id, error: null };
  } catch (err) {
    console.error('Error creating document:', err);
    return { id: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function updateDocument(document: Document) {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('documents')
      .update({
        case_id: document.caseId,
        type: document.type,
        file_url: document.fileURL,
        status: document.status,
        service_date: document.serviceDate || null,
        updated_at: now
      })
      .eq('id', document.docId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating document:', err);
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function deleteDocument(docId: string) {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting document:', err);
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}