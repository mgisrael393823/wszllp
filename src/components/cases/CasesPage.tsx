import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Pagination from '../ui/Pagination';
import Button from '../ui/Button';
import { Eye, Edit, File, Plus } from 'lucide-react';

// Map our case schema to the display format
interface CaseDisplay {
  id: string;
  caseNumber: string;
  property: string;
  tenant: string;
  status: string;
  nextHearing: string | null;
}

// We'll use real data instead of mock data
const CasesPage: React.FC = () => {
  const { state } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Map cases from data context to display format
  const mapCasesToDisplay = (): CaseDisplay[] => {
    return state.cases.map(caseItem => {
      // Find next hearing for this case (if any)
      const nextHearing = state.hearings
        .filter(h => h.caseId === caseItem.caseId)
        .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
        .find(h => new Date(h.hearingDate) > new Date());

      return {
        id: caseItem.caseId,
        caseNumber: caseItem.caseId, // Using caseId as case number for now
        property: caseItem.address,
        tenant: caseItem.defendant,
        status: caseItem.status,
        nextHearing: nextHearing ? nextHearing.hearingDate : null
      };
    });
  };

  const cases = mapCasesToDisplay();

  // Filter cases based on search term and status filter
  const filteredCases = cases.filter(caseItem => {
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

  // Handle viewing a case
  const handleViewCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
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
      accessor: (item: CaseDisplay) => {
        const statusColors = {
          'Active': 'bg-green-100 text-green-800',
          'Intake': 'bg-yellow-100 text-yellow-800',
          'Closed': 'bg-gray-100 text-gray-800',
          'Open': 'bg-green-100 text-green-800',
          'Pending': 'bg-yellow-100 text-yellow-800',
        };
        const colorClass = statusColors[item.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {item.status}
          </span>
        );
      },
    },
    {
      header: 'Next Hearing',
      accessor: (item: CaseDisplay) => {
        return item.nextHearing 
          ? new Date(item.nextHearing).toLocaleDateString() 
          : 'N/A';
      },
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (item: CaseDisplay) => (
        <div className="flex space-x-2">
          <Button 
            variant="text" 
            size="sm" 
            icon={<Eye size={16} />}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click 
              handleViewCase(item.id);
            }}
            aria-label={`View case ${item.caseNumber}`}
          />
          <Button 
            variant="text" 
            size="sm" 
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              handleViewCase(item.id);
            }}
            aria-label={`Edit case ${item.caseNumber}`}
          />
          <Button 
            variant="text" 
            size="sm" 
            icon={<File size={16} />}
            aria-label={`View documents for case ${item.caseNumber}`}
          />
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Active', label: 'Active' },
    { value: 'Intake', label: 'Intake' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Pending', label: 'Pending' },
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
        <div className="flex justify-end mb-4">
          <Button 
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => navigate('/cases/new')}
          >
            New Case
          </Button>
        </div>
      
        <Table 
          data={currentItems}
          columns={columns}
          keyField="id"
          onRowClick={(item) => handleViewCase(item.id)}
          emptyMessage={
            state.cases.length === 0 
              ? "No cases found. Add your first case or import data." 
              : "No cases found matching your criteria"
          }
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