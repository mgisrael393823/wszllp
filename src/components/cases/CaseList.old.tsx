import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, Table, Pagination, FilterBar } from '../ui';
import { LoadingState } from '../ui/StateComponents';
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
          dateFiled: c.dateFiled || null,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }));
        
        // Clear existing cases and load fresh from database
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            ...state,
            cases: mappedCases
          }
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

  // Get unique status values
  const statusOptions = Array.from(new Set(state.cases.map(c => c.status))).sort();
  
  // Get unique date values (year-month)
  const dateOptions = Array.from(new Set(state.cases.map(c => {
    if (!c.dateFiled) return null;
    let date = null;
    if (typeof c.dateFiled === 'string') {
      date = parseISO(c.dateFiled);
      if (!isValid(date)) {
        date = new Date(c.dateFiled);
      }
    }
    
    if (date && isValid(date)) {
      return format(date, 'yyyy-MM');
    }
    return null;
  }).filter(date => date !== null))).sort().reverse();

  return (
    <Card className="min-h-full">
      {isLoading ? (
        <LoadingState message="Loading cases..." />
      ) : (
        <>
          <FilterBar
              searchPlaceholder="Search by plaintiff, defendant, or address..."
              onSearchChange={setSearchTerm}
              filters={[
                {
                  label: 'Status',
                  value: statusFilter,
                  options: statusOptions,
                  onChange: setStatusFilter,
                },
                ...(dateOptions.length > 0 ? [{
                  label: 'Date Filed',
                  value: dateFilter,
                  options: dateOptions.map(date => {
                    const parsedDate = parseISO(date + '-01');
                    return {
                      value: date,
                      label: format(parsedDate, 'MMMM yyyy')
                    };
                  }),
                  onChange: setDateFilter,
                }] : [])
              ]}
            />

            {paginatedCases.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                {searchTerm || statusFilter || dateFilter ? 'No cases match your filters.' : 'No cases found.'}
              </div>
            ) : (
              <>
                <Table
                  columns={[
                    { header: 'Plaintiff', accessor: 'plaintiff' },
                    { header: 'Defendant', accessor: 'defendant' },
                    { header: 'Address', accessor: 'address' },
                    { 
                      header: 'Status', 
                      accessor: 'status',
                      cell: (value: string) => (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                          {value}
                        </span>
                      )
                    },
                    { 
                      header: 'Date Filed', 
                      accessor: 'dateFiled',
                      cell: (value: string | null) => {
                        if (!value) return <span className="text-neutral-400">Not filed</span>;
                        
                        let date = null;
                        if (typeof value === 'string') {
                          date = parseISO(value);
                          if (!isValid(date)) {
                            date = new Date(value);
                          }
                        }
                        
                        if (date && isValid(date)) {
                          return (
                            <div className="flex items-center gap-1 text-neutral-600">
                              <Calendar className="w-3 h-3" />
                              <span>{format(date, 'MMM dd, yyyy')}</span>
                            </div>
                          );
                        }
                        
                        return <span className="text-neutral-400">Invalid date</span>;
                      }
                    },
                  ]}
                  data={paginatedCases}
                  onRowClick={(row) => navigate(`/cases/${row.caseId}`)}
                />

                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
        </>
      )}
    </Card>
  );
};

export default CaseList;