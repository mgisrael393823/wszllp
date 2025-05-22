import React, { useState, useEffect } from 'react';
import { Plus, Filter, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hearings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage court hearings
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={() => navigate('/hearings/new')}
        >
          Add Hearing
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search court or case..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              {getDateFilterOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-neutral-500">Loading hearings...</p>
          </div>
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
    </div>
  );
};

export default HearingList;