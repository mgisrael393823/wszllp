import React, { useState } from 'react';
import { Plus, Filter, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';

const HearingList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Mock hearings data
  const hearings = [
    {
      hearingId: '1',
      caseTitle: 'Smith Property v. John Doe',
      courtName: 'Cook County Circuit Court',
      hearingDate: '2023-05-15T09:00:00',
      outcome: 'Pending'
    },
    {
      hearingId: '2',
      caseTitle: 'Oak Apartments v. Jane Smith',
      courtName: 'Cook County Circuit Court',
      hearingDate: '2023-05-16T10:30:00',
      outcome: 'Pending'
    },
    {
      hearingId: '3',
      caseTitle: 'Riverside Properties v. Michael Johnson',
      courtName: 'DuPage County Court',
      hearingDate: '2023-05-17T14:00:00',
      outcome: 'Pending'
    },
    {
      hearingId: '4',
      caseTitle: 'Lakeside Rentals v. Robert Williams',
      courtName: 'Lake County Circuit Court',
      hearingDate: '2023-05-18T09:30:00',
      outcome: 'Pending'
    },
    {
      hearingId: '5',
      caseTitle: 'Green Valley v. Lisa Brown',
      courtName: 'Will County Circuit Court',
      hearingDate: '2023-05-19T11:00:00',
      outcome: 'Pending'
    },
    {
      hearingId: '6',
      caseTitle: 'City View Apts v. David Miller',
      courtName: 'Cook County Circuit Court',
      hearingDate: '2023-05-22T10:00:00',
      outcome: 'Pending'
    },
    {
      hearingId: '7',
      caseTitle: 'Parkview Homes v. Sarah Davis',
      courtName: 'Kane County Circuit Court',
      hearingDate: '2023-05-23T13:30:00',
      outcome: 'Pending'
    },
    {
      hearingId: '8',
      caseTitle: 'Highland Residences v. Thomas Wilson',
      courtName: 'DuPage County Court',
      hearingDate: '2023-05-24T09:00:00',
      outcome: 'Pending'
    }
  ];

  // Filter hearings
  const filteredHearings = hearings.filter(h => {
    const matchesSearch = 
      h.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.courtName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter - simplified for mock data
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

  // Mock date filter options
  const getDateFilterOptions = () => {
    return [
      { value: '', label: 'All Dates' },
      { value: '2023-05', label: 'May 2023' },
      { value: '2023-06', label: 'June 2023' },
      { value: '2023-07', label: 'July 2023' }
    ];
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
      accessor: (item: typeof hearings[0]) => 
        new Date(item.hearingDate).toLocaleDateString(),
      sortable: false,
    },
    {
      header: 'Time',
      accessor: (item: typeof hearings[0]) => 
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
        <Button variant="primary" icon={<Plus size={16} />}>
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
          onRowClick={(item) => console.log('Clicked hearing:', item.hearingId)}
          emptyMessage="No hearings found. Add a new hearing to get started."
        />
        
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