import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';
import { Plus, Filter, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
import HearingForm from './HearingForm';

const HearingList: React.FC = () => {
  const { state } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Filter hearings
  const filteredHearings = state.hearings.filter(h => {
    // Get associated case for search by plaintiff/defendant
    const associatedCase = state.cases.find(c => c.caseId === h.caseId);
    
    const matchesSearch = 
      h.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (associatedCase && (
        associatedCase.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        associatedCase.defendant.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    // Date filter - by month/year
    const matchesDate = dateFilter 
      ? h.hearingDate.startsWith(dateFilter)
      : true;
    
    return matchesSearch && matchesDate;
  });

  // Sort by newest hearing date first
  const sortedHearings = [...filteredHearings].sort(
    (a, b) => new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime()
  );

  // Paginate
  const paginatedHearings = sortedHearings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setSelectedHearing(null);
    setIsModalOpen(true);
  };

  const openEditModal = (hearingId: string) => {
    setSelectedHearing(hearingId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHearing(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate month/year options for filter
  const getDateFilterOptions = () => {
    const options: {value: string, label: string}[] = [
      { value: '', label: 'All Dates' }
    ];
    
    const dates = new Set<string>();
    
    state.hearings.forEach(h => {
      const date = new Date(h.hearingDate);
      const yearMonth = format(date, 'yyyy-MM');
      dates.add(yearMonth);
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
      accessor: (item: typeof state.hearings[0]) => {
        const associatedCase = state.cases.find(c => c.caseId === item.caseId);
        return associatedCase 
          ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` 
          : 'Unknown Case';
      },
      sortable: false,
    },
    {
      header: 'Court',
      accessor: 'courtName',
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (item: typeof state.hearings[0]) => 
        format(new Date(item.hearingDate), 'MMM d, yyyy'),
      sortable: false,
    },
    {
      header: 'Time',
      accessor: (item: typeof state.hearings[0]) => 
        format(new Date(item.hearingDate), 'h:mm a'),
      sortable: false,
    },
    {
      header: 'Outcome',
      accessor: (item: typeof state.hearings[0]) => 
        item.outcome || 'Pending',
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hearings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage court hearings
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
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

        <Table 
          data={paginatedHearings}
          columns={columns}
          keyField="hearingId"
          onRowClick={(item) => openEditModal(item.hearingId)}
          emptyMessage="No hearings found. Add a new hearing to get started."
        />
        
        <Pagination
          totalItems={filteredHearings.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {isModalOpen && (
        <HearingForm 
          isOpen={isModalOpen}
          onClose={closeModal}
          hearingId={selectedHearing}
        />
      )}
    </div>
  );
};

export default HearingList;