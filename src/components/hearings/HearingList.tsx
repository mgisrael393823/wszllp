import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card, Table, Pagination, FilterBar, LoadingState } from '../ui';
import { useData } from '../../context/DataContext';
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

  // Use DataContext data (which handles sandbox routing)
  useEffect(() => {
    const processHearings = () => {
      setIsLoading(true);
      try {
        // Use data from DataContext (already sandbox-routed)
        const hearingsData = state.hearings;
        const casesData = state.cases;
        
        // Map the data to our display format
        const displayData: HearingDisplay[] = hearingsData.map(hearing => {
          // Find the case for this hearing using caseId from DataContext schema
          const caseItem = casesData.find(c => c.caseId === hearing.caseId);
          const caseTitle = caseItem 
            ? `${caseItem.plaintiff} v. ${caseItem.defendant}` 
            : 'Unknown Case';
          
          return {
            hearingId: hearing.hearingId,
            caseTitle,
            courtName: hearing.courtName || 'Not specified',
            hearingDate: hearing.hearingDate,
            outcome: hearing.outcome || 'Pending'
          };
        });
        
        // Update the hearings state
        setHearings(displayData);
        
      } catch (error) {
        console.error('Error processing hearings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    processHearings();
  }, [state.hearings, state.cases]);

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