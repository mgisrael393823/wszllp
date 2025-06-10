import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Invoice } from '../types/schema';

interface UseInvoicesOptions {
  caseId?: string;
  limit?: number;
}

interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useInvoices = (options?: UseInvoicesOptions): UseInvoicesReturn => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('invoices')
        .select('*')
        .order('issue_date', { ascending: false });

      if (options?.caseId) {
        query = query.eq('case_id', options.caseId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform the data to match frontend schema
      const transformedInvoices: Invoice[] = (data || []).map(inv => ({
        invoiceId: inv.id,
        caseId: inv.case_id,
        userId: inv.user_id,
        amount: inv.amount,
        description: inv.description,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        paid: inv.paid,
        paymentDate: inv.payment_date,
        paymentMethod: inv.payment_method,
        paymentReference: inv.payment_reference,
        notes: inv.notes,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      }));

      setInvoices(transformedInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch invoices'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Subscribe to changes
    const subscription = supabase
      .channel('invoices-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'invoices',
          filter: options?.caseId ? `case_id=eq.${options.caseId}` : undefined
        }, 
        () => {
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [options?.caseId, options?.limit]);

  return {
    invoices,
    isLoading,
    error,
    refetch: fetchInvoices
  };
};