import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, FileText, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
// DEBUGGING: Switch between real and mock data
import { useDocuments } from '../../hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

interface DocumentListProps {
  limit?: number;
  caseId?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ limit, caseId }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Memoize filters to prevent infinite re-renders
  const filters = useMemo(() => ({
    type: typeFilter,
    status: statusFilter,
    searchTerm: searchTerm,
    caseId: caseId
  }), [typeFilter, statusFilter, searchTerm, caseId]);

  // Use the Supabase hook for documents
  const { 
    documents, 
    isLoading, 
    error, 
    totalCount 
  } = useDocuments(
    limit, 
    filters,
    currentPage,
    itemsPerPage
  );
  
  // Show error toast if data fetching fails
  useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: 'Error Loading Documents',
        message: error.message || 'Failed to load documents. Please try again.',
        duration: 5000
      });
    }
  }, [error, addToast]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Document type options
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Complaint', label: 'Complaint' },
    { value: 'Summons', label: 'Summons' },
    { value: 'Affidavit', label: 'Affidavit' },
    { value: 'Motion', label: 'Motion' },
    { value: 'Order', label: 'Order' },
    { value: 'Other', label: 'Other' },
  ];

  // Document status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Served', label: 'Served' },
    { value: 'Failed', label: 'Failed' },
  ];

  // Table columns definition
  const columns = [
    {
      header: 'Document',
      accessor: (item: any) => {
        // Extract filename from URL
        const getFilenameFromUrl = (url: string) => {
          if (!url) return 'Unknown file';
          try {
            const urlParts = url.split('/');
            const filename = urlParts[urlParts.length - 1];
            // Decode URL-encoded characters
            return decodeURIComponent(filename);
          } catch (error) {
            return 'Unknown file';
          }
        };

        return (
          <div className="flex items-center">
            <FileText size={18} className="text-gray-400 mr-2" />
            <div>
              <div className="font-medium text-gray-700">{item.type}</div>
              <div className="text-gray-500 text-sm truncate max-w-xs">
                {getFilenameFromUrl(item.fileURL)}
              </div>
            </div>
          </div>
        );
      },
      sortable: false,
    },
    {
      header: 'Case',
      accessor: (item: any) => (
        item.case ? `${item.case.plaintiff} v. ${item.case.defendant}` : 'Unknown Case'
      ),
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
              item.status === 'Served' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`
          }
        >
          {item.status}
        </span>
      ),
      sortable: false,
    },
    {
      header: 'Service Date',
      accessor: (item: any) => 
        item.serviceDate ? new Date(item.serviceDate).toLocaleDateString() : 'Not served',
      sortable: false,
    },
  ];

  // Error display component
  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <AlertCircle size={20} className="text-red-500 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error loading documents</h3>
          <p className="text-sm text-red-700 mt-1">
            {error?.message || 'Failed to load documents. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="py-12 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
      <p className="text-neutral-500">Loading documents...</p>
    </div>
  );

  // Simplified view for when a limit is provided
  if (limit) {
    return (
      <div>
        {error && <ErrorMessage />}
        
        {isLoading ? (
          <LoadingState />
        ) : (
          <Table 
            data={documents}
            columns={columns}
            keyField="docId"
            onRowClick={(item) => navigate(`/documents/${item.docId}`)}
            emptyMessage="No documents found. Add a new document to get started."
          />
        )}
      </div>
    );
  }
  
  // Full view with filters and pagination
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage legal documents and track their service status
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={() => navigate('/documents/new')}
        >
          Add Document
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <ErrorMessage />}
        
        {isLoading ? (
          <LoadingState />
        ) : (
          <Table 
            data={documents}
            columns={columns}
            keyField="docId"
            onRowClick={(item) => navigate(`/documents/${item.docId}`)}
            emptyMessage="No documents found. Add a new document to get started."
          />
        )}
        
        <Pagination
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};

export default DocumentList;