import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, isValid } from 'date-fns';
import { Plus, Filter, Search, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
import CaseForm from './CaseForm';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
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

  const openAddModal = () => {
    setSelectedCase(null);
    setIsModalOpen(true);
  };

  const openEditModal = (caseId: string) => {
    setSelectedCase(caseId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCase(null);
  };

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
                'bg-gray-100 text-gray-800'}`
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all legal cases and related information
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
          Add Case
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              <option value="">All Statuses</option>
              <option value="Intake">Intake</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Intake">Intake</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
            
            <Calendar size={16} className="text-gray-400 ml-2" />
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
            <p className="text-neutral-500">Loading cases...</p>
          </div>
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

      {isModalOpen && (
        <CaseForm 
          isOpen={isModalOpen}
          onClose={closeModal}
          caseId={selectedCase}
        />
      )}
    </div>
  );
};

export default CaseList;