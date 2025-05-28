import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getTableName, isSandboxUser } from '../utils/sandbox';
import { useSandboxMode } from './useSandboxMode';
import { useAuth } from '../context/AuthContext';
import type { Case, Contact, Hearing, Document } from '../types/schema';

// Sandbox-aware cases hook
export function useSandboxCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userEmail } = useSandboxMode();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const tableName = getTableName('cases', userEmail);
        
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setCases(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [userEmail]);

  return { cases, loading, error, refetch: () => fetchCases() };
}

// Sandbox-aware contacts hook
export function useSandboxContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userEmail } = useSandboxMode();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const tableName = getTableName('contacts', userEmail);
        
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setContacts(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [userEmail]);

  return { contacts, loading, error, refetch: () => fetchContacts() };
}

// Sandbox-aware hearings hook
export function useSandboxHearings() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userEmail } = useSandboxMode();

  useEffect(() => {
    const fetchHearings = async () => {
      try {
        setLoading(true);
        const tableName = getTableName('hearings', userEmail);
        
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .order('scheduled_date', { ascending: true });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setHearings(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHearings();
  }, [userEmail]);

  return { hearings, loading, error, refetch: () => fetchHearings() };
}

// Sandbox-aware documents hook
export function useSandboxDocuments(caseId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userEmail } = useSandboxMode();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const tableName = getTableName('documents', userEmail);
        
        let query = supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (caseId) {
          query = query.eq('case_id', caseId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setDocuments(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userEmail, caseId]);

  return { documents, loading, error, refetch: () => fetchDocuments() };
}

// Combined dashboard data hook for sandbox - only fetches if user is sandbox user
const DASHBOARD_CACHE_KEY = 'sandbox-dashboard-cache';
let dashboardCache: {
  cases: Case[];
  contacts: Contact[];
  hearings: Hearing[];
  documents: Document[];
  loading: boolean;
} | null = null;

export function useSandboxDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    cases: [] as Case[],
    contacts: [] as Contact[],
    hearings: [] as Hearing[],
    documents: [] as Document[],
    loading: false
  });

  useEffect(() => {
    if (!user || !isSandboxUser(user.email)) {
      return;
    }

    if (dashboardCache) {
      setData(dashboardCache);
      return;
    }

    const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
        dashboardCache = parsed;
      } catch {
        /* ignore parse errors */
      }
    }

    const fetchAllData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      
      try {

        const [casesRes, contactsRes, hearingsRes, documentsRes] = await Promise.all([
          supabase.from(getTableName('cases', user.email)).select('*'),
          supabase.from(getTableName('contacts', user.email)).select('*'),
          supabase.from(getTableName('hearings', user.email)).select('*'),
          supabase.from(getTableName('documents', user.email)).select('*')
        ]);

        // Map Supabase data to frontend schema
        const mappedCases = (casesRes.data || []).map(c => ({
          caseId: c.id,
          plaintiff: c.client_name || 'Demo Landlord',
          defendant: c.title || 'Demo Tenant',
          address: c.property_address || 'Demo Address',
          status: c.status === 'open' ? 'Active' : 'Intake',
          intakeDate: c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          createdAt: c.created_at || new Date().toISOString(),
          updatedAt: c.updated_at || new Date().toISOString()
        }));

        const mappedContacts = (contactsRes.data || []).map(c => ({
          contactId: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          notes: c.notes,
          createdAt: c.created_at || new Date().toISOString(),
          updatedAt: c.updated_at || new Date().toISOString()
        }));

        const mappedHearings = (hearingsRes.data || []).map(h => ({
          hearingId: h.id,
          caseId: h.case_id,
          courtName: h.title || h.location || 'Demo Court',
          hearingDate: h.hearing_date || new Date().toISOString(),
          outcome: h.outcome,
          createdAt: h.created_at || new Date().toISOString(),
          updatedAt: h.updated_at || new Date().toISOString()
        }));

        const mappedDocuments = (documentsRes.data || []).map(d => ({
          docId: d.id,
          caseId: d.case_id,
          type: 'Other',
          fileURL: d.file_path || '/placeholder.pdf',
          status: 'Pending',
          serviceDate: undefined,
          createdAt: d.created_at || new Date().toISOString(),
          updatedAt: d.updated_at || new Date().toISOString()
        }));


        if (hearingsRes.error) {
          console.error('Hearings query error:', hearingsRes.error);
        }
        if (documentsRes.error) {
          console.error('Documents query error:', documentsRes.error);
        }

        // If any of the key queries failed or returned empty data, use fallback data
        if (hearingsRes.error || documentsRes.error || !documentsRes.data || documentsRes.data.length === 0) {
          
          const fallbackHearings = [
            {
              hearingId: 'demo-hearing-1',
              caseId: mappedCases[0]?.caseId || 'demo-case-1',
              courtName: 'Demo District Court',
              hearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              outcome: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              hearingId: 'demo-hearing-2',
              caseId: mappedCases[1]?.caseId || 'demo-case-2',
              courtName: 'Sample Municipal Court',
              hearingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              outcome: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];

          const fallbackDocuments = [
            {
              docId: 'demo-doc-1',
              caseId: mappedCases[0]?.caseId || 'demo-case-1',
              type: 'Complaint',
              fileURL: '/demo-complaint.pdf',
              status: 'Pending',
              serviceDate: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              docId: 'demo-doc-2',
              caseId: mappedCases[1]?.caseId || 'demo-case-2',
              type: 'Summons',
              fileURL: '/demo-summons.pdf',
              status: 'Served',
              serviceDate: '2024-01-22',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];

          const finalData = {
            cases: mappedCases,
            contacts: mappedContacts,
            hearings: hearingsRes.error ? fallbackHearings : mappedHearings,
            documents: (documentsRes.error || !documentsRes.data || documentsRes.data.length === 0) ? fallbackDocuments : mappedDocuments,
            loading: false
          };
          setData(finalData);
          dashboardCache = finalData;
          sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(finalData));
          return;
        }

        const finalData = {
          cases: mappedCases,
          contacts: mappedContacts,
          hearings: mappedHearings,
          documents: mappedDocuments,
          loading: false
        };
        setData(finalData);
        dashboardCache = finalData;
        sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(finalData));
      } catch (error) {
        console.error('Error fetching sandbox data:', error);
        
        // If Supabase fails, use fallback demo data
        const fallbackData = {
          cases: [
            {
              caseId: 'demo-case-1',
              plaintiff: 'Demo Landlord LLC',
              defendant: 'John Demo Tenant',
              address: '123 Demo Street, Demo City, DC 12345',
              status: 'Active',
              intakeDate: '2024-01-15',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              caseId: 'demo-case-2',
              plaintiff: 'Sample Property Management',
              defendant: 'Jane Sample Tenant',
              address: '456 Sample Avenue, Sample Town, ST 67890',
              status: 'Intake',
              intakeDate: '2024-01-20',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          contacts: [
            {
              contactId: 'demo-contact-1',
              name: 'Demo Attorney',
              email: 'attorney@demo.com',
              phone: '555-0123',
              address: '789 Legal Plaza, Law City, LC 11111',
              notes: 'Primary attorney for demo cases',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          hearings: [
            {
              hearingId: 'demo-hearing-1',
              caseId: 'demo-case-1',
              courtName: 'Demo District Court',
              hearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              outcome: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              hearingId: 'demo-hearing-2',
              caseId: 'demo-case-2',
              courtName: 'Sample Municipal Court',
              hearingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
              outcome: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          documents: [
            {
              docId: 'demo-doc-1',
              caseId: 'demo-case-1',
              type: 'Complaint',
              fileURL: '/demo-complaint.pdf',
              status: 'Pending',
              serviceDate: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              docId: 'demo-doc-2',
              caseId: 'demo-case-2',
              type: 'Summons',
              fileURL: '/demo-summons.pdf',
              status: 'Served',
              serviceDate: '2024-01-22',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          loading: false
        };
        
        console.log('Using fallback demo data due to Supabase error');
        setData(fallbackData);
        dashboardCache = fallbackData;
        sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(fallbackData));
      }
    };

    fetchAllData();
  }, [user]);

  return {
    ...data,
    metrics: {
      totalCases: data.cases.length,
      totalContacts: data.contacts.length,
      upcomingHearings: data.hearings.filter(h => new Date(h.scheduled_date) > new Date()).length,
      totalDocuments: data.documents.length
    }
  };
}
