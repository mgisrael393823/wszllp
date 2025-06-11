import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { commonColumns } from '../ui/table-columns/common-columns';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface HearingDisplay {
  hearingId: string;
  caseTitle: string;
  courtName: string;
  hearingDate: string;
  hearingTime: string;
  outcome: string;
}

const HearingList: React.FC = () => {
  const { state, dispatch } = useData();
  const navigate = useNavigate();
  const [hearings, setHearings] = useState<HearingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch hearings from Supabase
  useEffect(() => {
    const fetchHearings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch hearings from Supabase
        const { data: hearingsData, error: hearingsError } = await supabase
          .from('hearings')
          .select(`
            id,
            case_id,
            court_name,
            hearing_date,
            participants,
            outcome,
            created_at,
            updated_at
          `);
          
        if (hearingsError) throw hearingsError;
        
        // Fetch cases for joining data
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('id, plaintiff, defendant');
          
        if (casesError) throw casesError;
        
        // Map the data to our display format
        const displayData: HearingDisplay[] = hearingsData.map(hearing => {
          // Find the case for this hearing
          const caseItem = casesData.find(c => c.id === hearing.case_id);
          const caseTitle = caseItem 
            ? `${caseItem.plaintiff} v. ${caseItem.defendant}` 
            : 'Unknown Case';
          
          const hearingDateTime = new Date(hearing.hearing_date);
          
          return {
            hearingId: hearing.id,
            caseTitle,
            courtName: hearing.court_name || 'Not specified',
            hearingDate: hearingDateTime.toLocaleDateString(),
            hearingTime: hearingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            outcome: hearing.outcome || 'Pending'
          };
        });
        
        setHearings(displayData);
        
        // Update the global state
        const hearingsForDataContext = hearingsData.map(h => ({
          hearingId: h.id,
          caseId: h.case_id,
          courtName: h.court_name || '',
          hearingDate: h.hearing_date,
          outcome: h.outcome || '',
          createdAt: h.created_at,
          updatedAt: h.updated_at
        }));
        
        // Update the data context with the hearings
        hearingsForDataContext.forEach(hearing => {
          dispatch({
            type: 'ADD_HEARING',
            payload: hearing
          });
        });
        
      } catch (err) {
        console.error('Error fetching hearings:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHearings();
  }, [dispatch]);

  // Column definitions for TanStack Table
  const columns: ColumnDef<HearingDisplay>[] = [
    {
      accessorKey: 'caseTitle',
      header: 'Case',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'courtName',
      header: 'Court',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'hearingDate',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-neutral-600">
          <Calendar className="w-3 h-3" />
          <span>{row.original.hearingDate}</span>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'hearingTime',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.hearingTime}</span>
      ),
    },
    {
      accessorKey: 'outcome',
      header: 'Outcome',
      cell: ({ row }) => {
        const outcome = row.original.outcome;
        const getOutcomeColor = (outcome: string) => {
          switch (outcome.toLowerCase()) {
            case 'pending':
              return 'bg-yellow-100 text-yellow-800';
            case 'completed':
            case 'judgment':
              return 'bg-green-100 text-green-800';
            case 'continued':
              return 'bg-blue-100 text-blue-800';
            case 'dismissed':
              return 'bg-red-100 text-red-800';
            default:
              return 'bg-neutral-100 text-neutral-800';
          }
        };
        
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(outcome)}`}
          >
            {outcome}
          </span>
        );
      },
      meta: {
        filterVariant: 'select',
      },
    },
  ];

  // Handle empty state
  if (!isLoading && hearings.length === 0 && !error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <Calendar size={64} className="mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No hearings scheduled</h3>
        <p className="text-neutral-500">Add a new hearing to get started.</p>
      </div>
    );
  }

  return (
    <DataTable
      data={hearings}
      columns={columns}
      isLoading={isLoading}
      error={error}
      onRowClick={(row) => navigate(`/hearings/${row.hearingId}`)}
      enableRowSelection
    />
  );
};

export default HearingList;