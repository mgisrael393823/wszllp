import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Pagination from '../ui/Pagination';
import Button from '../ui/Button';
import { Eye, Edit, File } from 'lucide-react';

// Mock data
interface Case {
  id: string;
  caseNumber: string;
  property: string;
  tenant: string;
  status: 'Open' | 'Closed' | 'Pending';
  nextHearing: string | null;
}

const mockCases: Case[] = [
  {
    id: '1',
    caseNumber: 'EVT-2023-1234',
    property: '123 Main St, Unit 4B',
    tenant: 'John Smith',
    status: 'Open',
    nextHearing: '2023-06-15',
  },
  {
    id: '2',
    caseNumber: 'EVT-2023-1235',
    property: '456 Oak Ave, Unit 101',
    tenant: 'Emily Johnson',
    status: 'Open',
    nextHearing: '2023-06-20',
  },
  {
    id: '3',
    caseNumber: 'EVT-2023-1236',
    property: '789 Pine St, Unit 3A',
    tenant: 'Michael Brown',
    status: 'Closed',
    nextHearing: null,
  },
  {
    id: '4',
    caseNumber: 'EVT-2023-1237',
    property: '321 Maple Rd, Unit 7C',
    tenant: 'Sarah Wilson',
    status: 'Open',
    nextHearing: '2023-06-22',
  },
  {
    id: '5',
    caseNumber: 'EVT-2023-1238',
    property: '555 Elm St, Unit 2D',
    tenant: 'David Martinez',
    status: 'Pending',
    nextHearing: '2023-06-28',
  },
  {
    id: '6',
    caseNumber: 'EVT-2023-1239',
    property: '888 Cedar Ln, Unit 5F',
    tenant: 'Lisa Thompson',
    status: 'Closed',
    nextHearing: null,
  },
  {
    id: '7',
    caseNumber: 'EVT-2023-1240',
    property: '777 Birch Ave, Unit 10B',
    tenant: 'Robert Garcia',
    status: 'Open',
    nextHearing: '2023-07-05',
  },
];

const CasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter cases based on search term and status filter
  const filteredCases = mockCases.filter(caseItem => {
    const matchesSearch = searchTerm === '' || 
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.tenant.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || statusFilter === 'All' || 
      caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalItems = filteredCases.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCases.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Columns configuration for the table
  const columns = [
    {
      header: 'Case #',
      accessor: 'caseNumber',
      sortable: true,
    },
    {
      header: 'Property',
      accessor: 'property',
      sortable: true,
    },
    {
      header: 'Tenant',
      accessor: 'tenant',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (caseItem: Case) => {
        const statusColors = {
          Open: 'bg-green-100 text-green-800',
          Closed: 'bg-gray-100 text-gray-800',
          Pending: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[caseItem.status]}`}>
            {caseItem.status}
          </span>
        );
      },
    },
    {
      header: 'Next Hearing',
      accessor: (caseItem: Case) => {
        return caseItem.nextHearing 
          ? new Date(caseItem.nextHearing).toLocaleDateString() 
          : 'N/A';
      },
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (caseItem: Case) => (
        <div className="flex space-x-2">
          <Button 
            variant="text" 
            size="sm" 
            icon={<Eye size={16} />}
            aria-label={`View case ${caseItem.caseNumber}`}
          />
          <Button 
            variant="text" 
            size="sm" 
            icon={<Edit size={16} />}
            aria-label={`Edit case ${caseItem.caseNumber}`}
          />
          <Button 
            variant="text" 
            size="sm" 
            icon={<File size={16} />}
            aria-label={`View documents for case ${caseItem.caseNumber}`}
          />
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Open', label: 'Open' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Cases</h1>
      
      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <Input 
            placeholder="Search cases..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
        <div className="w-full md:w-48">
          <Select 
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            placeholder="Status"
          />
        </div>
      </div>
      
      {/* Cases table */}
      <Card>
        <Table 
          data={currentItems}
          columns={columns}
          keyField="id"
          onRowClick={(caseItem) => console.log('Case clicked:', caseItem.id)}
          emptyMessage="No cases found matching your criteria"
        />
        
        {/* Pagination */}
        <Pagination 
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};

export default CasesPage;