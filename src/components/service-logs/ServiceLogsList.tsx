import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { format, parseISO, isValid } from 'date-fns';
import { Plus, Filter, Truck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
import ServiceLogForm from './ServiceLogForm';

const ServiceLogsList: React.FC = () => {
  const { state } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Filter service logs
  const filteredLogs = state.serviceLogs.filter(log => {
    // Get associated document
    const document = state.documents.find(d => d.docId === log.docId);
    // Get associated case if document exists
    const associatedCase = document ? state.cases.find(c => c.caseId === document.caseId) : null;
    
    const matchesSearch = 
      (document && document.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (associatedCase && (
        associatedCase.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        associatedCase.defendant.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesMethod = methodFilter ? log.method === methodFilter : true;
    const matchesResult = resultFilter ? log.result === resultFilter : true;
    
    return matchesSearch && matchesMethod && matchesResult;
  });

  // Sort by newest attempt date first
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = typeof a.attemptDate === 'string'
      ? parseISO(a.attemptDate)
      : a.attemptDate instanceof Date
      ? a.attemptDate
      : null;
    const dateB = typeof b.attemptDate === 'string'
      ? parseISO(b.attemptDate)
      : b.attemptDate instanceof Date
      ? b.attemptDate
      : null;
    const timeA = dateA && isValid(dateA) ? dateA.getTime() : 0;
    const timeB = dateB && isValid(dateB) ? dateB.getTime() : 0;
    return timeB - timeA;
  });

  // Paginate
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setSelectedLog(null);
    setIsModalOpen(true);
  };

  const openEditModal = (logId: string) => {
    setSelectedLog(logId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Method options for filter
  const methodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'Sheriff', label: 'Sheriff' },
    { value: 'SPS', label: 'SPS' },
  ];

  // Result options for filter
  const resultOptions = [
    { value: '', label: 'All Results' },
    { value: 'Success', label: 'Success' },
    { value: 'Failed', label: 'Failed' },
  ];

  // Table columns definition
  const columns = [
    {
      header: 'Document',
      accessor: (item: typeof state.serviceLogs[0]) => {
        const document = state.documents.find(d => d.docId === item.docId);
        return document ? document.type : 'Unknown Document';
      },
      sortable: false,
    },
    {
      header: 'Case',
      accessor: (item: typeof state.serviceLogs[0]) => {
        const document = state.documents.find(d => d.docId === item.docId);
        if (!document) return 'Unknown Case';
        
        const associatedCase = state.cases.find(c => c.caseId === document.caseId);
        return associatedCase 
          ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` 
          : 'Unknown Case';
      },
      sortable: false,
    },
    {
      header: 'Method',
      accessor: 'method',
      sortable: true,
    },
    {
      header: 'Attempt Date',
      accessor: (item: typeof state.serviceLogs[0]) => {
        const date = typeof item.attemptDate === 'string'
          ? parseISO(item.attemptDate)
          : item.attemptDate instanceof Date
          ? item.attemptDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy h:mm a')
          : 'Invalid Date';
      },
      sortable: false,
    },
    {
      header: 'Result',
      accessor: (item: typeof state.serviceLogs[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.result === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`
          }
        >
          {item.result}
        </span>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track document service attempts and outcomes
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
          Add Service Log
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search documents or cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Truck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              {methodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              {resultOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table 
          data={paginatedLogs}
          columns={columns}
          keyField="logId"
          onRowClick={(item) => openEditModal(item.logId)}
          emptyMessage="No service logs found. Add a new log to get started."
        />
        
        <Pagination
          totalItems={filteredLogs.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {isModalOpen && (
        <ServiceLogForm 
          isOpen={isModalOpen}
          onClose={closeModal}
          logId={selectedLog}
        />
      )}
    </div>
  );
};

export default ServiceLogsList;