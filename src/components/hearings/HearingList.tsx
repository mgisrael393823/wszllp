import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card, Table, Pagination, FilterBar, LoadingState } from '../ui';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface HearingDisplay {
  hearingId: string;
  caseTitle: string;
  courtName: string;
  hearingDate: string;
  outcome: string;
}

const HearingList: React.FC = () => {
  const { state, dispatch } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [hearings, setHearings] = useState<HearingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const itemsPerPage = 10;

  // Fetch hearings from Supabase
  useEffect(() => {
    const fetchHearings = async () => {
      setIsLoading(true);
      try {
        // Fetch hearings from Supabase
        const { data: hearingsData, error } = await supabase
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
          
        if (error) throw error;
        
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
          
          return {
            hearingId: hearing.id,
            caseTitle,
            courtName: hearing.court_name || 'Not specified',
            hearingDate: hearing.hearing_date,
            outcome: hearing.outcome || 'Pending'
          };
        });
        
        // Update the hearings state
        setHearings(displayData);
        
        // Also update the global state (this is optional, depending on your architecture)
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
        // You might want to add a batch update action to your reducer
        hearingsForDataContext.forEach(hearing => {
          dispatch({
            type: 'ADD_HEARING',
            payload: hearing
          });
        });
        
      } catch (error) {
        console.error('Error fetching hearings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHearings();
  }, [dispatch]);

  // Filter hearings
  const filteredHearings = hearings.filter(h => {
    const matchesSearch = 
      h.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.courtName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    const matchesDate = dateFilter 
      ? new Date(h.hearingDate).toISOString().startsWith(dateFilter)
      : true;
    
    return matchesSearch && matchesDate;
  });

  // Paginate
  const paginatedHearings = filteredHearings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate date filter options from actual hearings
  const getDateFilterOptions = () => {
    const options: {value: string, label: string}[] = [
      { value: '', label: 'All Dates' }
    ];
    
    const dates = new Set<string>();
    
    state.hearings.forEach(h => {
      if (h.hearingDate) {
        const date = new Date(h.hearingDate);
        const yearMonth = format(date, 'yyyy-MM');
        dates.add(yearMonth);
      }
    });
    
    Array.from(dates).sort().reverse().forEach(date => {
      const [year, month] = date.split('-');
      options.push({
        value: date,
        label: `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`
      });
    });
    
    return options;
  };

  // Table columns definition
  const columns = [
    {
      header: 'Case',
      accessor: 'caseTitle',
      sortable: true,
    },
    {
      header: 'Court',
      accessor: 'courtName',
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (item: HearingDisplay) => 
        new Date(item.hearingDate).toLocaleDateString(),
      sortable: false,
    },
    {
      header: 'Time',
      accessor: (item: HearingDisplay) => 
        new Date(item.hearingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sortable: false,
    },
    {
      header: 'Outcome',
      accessor: 'outcome',
      sortable: false,
    },
  ];

  return (
    <Card>
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search court or case..."
          secondaryFilter={{
            value: dateFilter,
            onChange: setDateFilter,
            options: getDateFilterOptions(),
            placeholder: "All Dates",
            icon: <Calendar className="icon-standard text-neutral-400" />
          }}
        />

        {isLoading ? (
          <LoadingState message="Loading hearings..." />
        ) : (
          <Table 
            data={paginatedHearings}
            columns={columns}
            keyField="hearingId"
            onRowClick={(item) => navigate(`/hearings/${item.hearingId}`)}
            emptyMessage="No hearings found. Add a new hearing to get started."
          />
        )}
        
        <Pagination
          totalItems={filteredHearings.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
    </Card>
  );
};

export default HearingList;