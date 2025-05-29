import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, Table, Pagination, FilterBar, LoadingState } from '../ui';
import { getStatusColor } from '../../utils/statusColors';

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
          dateFiled: c.dateFiled,
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
      c.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.defendant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesDate = dateFilter ? (c.dateFiled && (() => {
      // Parse the MM/DD/YY date and check if it matches the selected year-month
      let date = null;
      if (typeof c.dateFiled === 'string') {
        date = parseISO(c.dateFiled);
        if (!isValid(date)) {
          date = new Date(c.dateFiled);
        }
      }
      
      if (date && isValid(date)) {
        const yearMonth = format(date, 'yyyy-MM');
        return yearMonth === dateFilter;
      }
      return false;
    })()) : true;
    
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
      if (!c.dateFiled) return;
      
      let date = null;
      if (typeof c.dateFiled === 'string') {
        // Try parsing as ISO first
        date = parseISO(c.dateFiled);
        // If that fails, try parsing MM/DD/YY format
        if (!isValid(date)) {
          date = new Date(c.dateFiled);
        }
      } else if (c.dateFiled instanceof Date) {
        date = c.dateFiled;
      }
      
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
      accessor: 'status',
      sortable: true,
      renderCell: (value: unknown, item: typeof state.cases[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      header: 'Date Filed',
      accessor: 'dateFiled',
      sortable: true,
      renderCell: (value: unknown, item: typeof state.cases[0]) => {
        if (!item.dateFiled) return 'Not filed';
        
        let date = null;
        if (typeof item.dateFiled === 'string') {
          // Try parsing as ISO first
          date = parseISO(item.dateFiled);
          // If that fails, try parsing MM/DD/YY format
          if (!isValid(date)) {
            date = new Date(item.dateFiled);
          }
        } else if (item.dateFiled instanceof Date) {
          date = item.dateFiled;
        }
        
        return date && isValid(date) 
          ? format(date, 'MMM d, yyyy') 
          : 'Invalid Date';
      },
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
            { value: 'SPS NOT SERVED', label: 'SPS NOT SERVED' },
            { value: 'SPS PENDING', label: 'SPS PENDING' },
            { value: 'SEND TO SPS', label: 'SEND TO SPS' },
            { value: 'SPS SERVED', label: 'SPS SERVED' }
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