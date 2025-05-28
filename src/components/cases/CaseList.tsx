import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, Table, Pagination, FilterBar, LoadingState } from '../ui';

const CaseList: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch cases from Supabase when component mounts
  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*');
          
        if (error) throw error;
        
        // Map the data to match our app's data structure
        const mappedCases = data.map(c => ({
          caseId: c.id,
          plaintiff: c.plaintiff,
          defendant: c.defendant,
          address: c.address || '',
          status: c.status,
          intakeDate: c.intakeDate,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }));
        
        // Update the local state
        mappedCases.forEach(caseItem => {
          dispatch({
            type: 'ADD_CASE',
            payload: caseItem
          });
        });
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCases();
  }, [dispatch]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Filter cases based on search and status
  const filteredCases = state.cases.filter(c => {
    const matchesSearch = 
      (c.plaintiff || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.defendant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesDate = dateFilter ? c.intakeDate.startsWith(dateFilter) : true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });


  // Sort by newest first
  const sortedCases = [...filteredCases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Paginate
  const totalPages = Math.ceil(sortedCases.length / itemsPerPage);
  const paginatedCases = sortedCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate month/year options for date filter
  const getDateFilterOptions = () => {
    const options: {value: string, label: string}[] = [
      { value: '', label: 'All Dates' }
    ];
    
    const dates = new Set<string>();
    
    state.cases.forEach(c => {
      const date = typeof c.intakeDate === 'string' 
        ? parseISO(c.intakeDate) 
        : c.intakeDate instanceof Date 
        ? c.intakeDate 
        : null;
      
      if (date && isValid(date)) {
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
      header: 'Case ID',
      accessor: 'caseId',
      sortable: true,
    },
    {
      header: 'Plaintiff',
      accessor: 'plaintiff',
      sortable: true,
    },
    {
      header: 'Defendant',
      accessor: 'defendant',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.cases[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.status === 'Intake' ? 'bg-blue-100 text-blue-800' : 
              item.status === 'Active' ? 'bg-green-100 text-green-800' : 
                'bg-neutral-100 text-neutral-800'}`
          }
        >
          {item.status}
        </span>
      ),
      sortable: false,
    },
    {
      header: 'Intake Date',
      accessor: (item: typeof state.cases[0]) => {
        const date = typeof item.intakeDate === 'string' 
          ? parseISO(item.intakeDate) 
          : item.intakeDate instanceof Date 
          ? item.intakeDate 
          : null;
        
        return date && isValid(date) 
          ? format(date, 'MMM d, yyyy') 
          : 'Invalid Date';
      },
      sortable: true,
    },
  ];

  return (
    <Card>
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search cases..."
        primaryFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: '', label: 'All Statuses' },
            { value: 'Intake', label: 'Intake' },
            { value: 'Active', label: 'Active' },
            { value: 'Closed', label: 'Closed' }
          ]
        }}
        secondaryFilter={{
          value: dateFilter,
          onChange: setDateFilter,
          options: getDateFilterOptions(),
          icon: <Calendar className="icon-standard text-neutral-400" />
        }}
      />

        {isLoading ? (
          <LoadingState message="Loading cases..." />
        ) : (
          <Table
            data={paginatedCases}
            columns={columns}
            keyField="caseId"
            onRowClick={(item) => navigate(`/cases/${item.caseId}`)}
            emptyMessage="No cases found. Add a new case to get started."
          />
        )}
        
        <Pagination
          totalItems={filteredCases.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>
  );
};

export default CaseList;