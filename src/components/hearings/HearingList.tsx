import React, { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { EmptyState } from '../ui';
import { commonColumns } from '../ui/table-columns/common-columns';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface HearingDisplay {
  hearingId: string;
  caseTitle: string;
  courtName: string;
  hearingDate: string;
  hearingTime: string;
  outcome: string;
  rawDate: Date;
}

interface HearingListProps {
  temporalFilter?: 'upcoming' | 'past';
}

const HearingList: React.FC<HearingListProps> = ({ temporalFilter = 'upcoming' }) => {
  const { state, dispatch } = useData();
  const navigate = useNavigate();
  const [apiHearings, setApiHearings] = useState<HearingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if we have local hearings from DataContext
  const hasLocalHearings = state.hearings.length > 0;

  // Process local hearings from DataContext
  const processLocalHearings = (): HearingDisplay[] => {
    const now = startOfDay(new Date());
    
    const allDisplayData: HearingDisplay[] = state.hearings.map(hearing => {
      // Find the case for this hearing
      const caseItem = state.cases.find(c => c.caseId === hearing.caseId);
      const caseTitle = caseItem 
        ? `${caseItem.plaintiff} v. ${caseItem.defendant}` 
        : 'Unknown Case';
      
      const hearingDateTime = new Date(hearing.hearingDate);
      
      return {
        hearingId: hearing.hearingId,
        caseTitle,
        courtName: hearing.courtName || 'Not specified',
        hearingDate: hearingDateTime.toLocaleDateString(),
        hearingTime: hearingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        outcome: hearing.outcome || 'Pending',
        rawDate: hearingDateTime
      };
    });

    // Apply temporal filtering
    const filteredData = allDisplayData.filter(hearing => {
      const hearingDate = startOfDay(hearing.rawDate);
      
      switch (temporalFilter) {
        case 'upcoming':
          return isAfter(hearingDate, now) || hearingDate.getTime() === now.getTime();
        case 'past':
          return isBefore(hearingDate, now);
        default:
          return true;
      }
    });

    // Sort by date (upcoming: earliest first, past: latest first)
    return filteredData.sort((a, b) => {
      if (temporalFilter === 'upcoming') {
        return a.rawDate.getTime() - b.rawDate.getTime();
      } else {
        return b.rawDate.getTime() - a.rawDate.getTime();
      }
    });
  };

  // Use local hearings first, fallback to API data
  const hearings = hasLocalHearings ? processLocalHearings() : apiHearings;

  // Fetch hearings from Supabase only if we don't have local data
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
        
        // Map the data to our display format and apply temporal filtering
        const now = startOfDay(new Date());
        
        const allDisplayData: HearingDisplay[] = hearingsData.map(hearing => {
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
            outcome: hearing.outcome || 'Pending',
            rawDate: hearingDateTime
          };
        });

        // Apply temporal filtering
        const filteredData = allDisplayData.filter(hearing => {
          const hearingDate = startOfDay(hearing.rawDate);
          
          switch (temporalFilter) {
            case 'upcoming':
              return isAfter(hearingDate, now) || hearingDate.getTime() === now.getTime();
            case 'past':
              return isBefore(hearingDate, now);
            default:
              return true;
          }
        });

        // Sort by date (upcoming: earliest first, past: latest first)
        const sortedData = filteredData.sort((a, b) => {
          if (temporalFilter === 'upcoming') {
            return a.rawDate.getTime() - b.rawDate.getTime();
          } else {
            return b.rawDate.getTime() - a.rawDate.getTime();
          }
        });
        
        setApiHearings(sortedData);
        
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
    
    // Only fetch from API if we don't have local hearings
    if (!hasLocalHearings) {
      fetchHearings();
    } else {
      setIsLoading(false);
      setError(null);
    }
  }, [dispatch, temporalFilter, hasLocalHearings]);

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

  // Handle empty state with design system component
  if (!isLoading && hearings.length === 0 && !error) {
    const getEmptyStateContent = () => {
      switch (temporalFilter) {
        case 'upcoming':
          return {
            title: "No upcoming hearings",
            description: "You have no hearings scheduled for the future. Schedule a hearing to get started."
          };
        case 'past':
          return {
            title: "No past hearings",
            description: "No completed hearings found. Past hearings will appear here once they've occurred."
          };
        default:
          return {
            title: "No hearings found",
            description: "Add a new hearing to get started."
          };
      }
    };

    const { title, description } = getEmptyStateContent();

    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16 text-neutral-400" />}
        title={title}
        description={description}
        action={temporalFilter === 'upcoming' ? {
          label: "Schedule Hearing",
          onClick: () => navigate('/hearings/new'),
          variant: "primary" as const,
          icon: <Plus size={16} />
        } : undefined}
      />
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