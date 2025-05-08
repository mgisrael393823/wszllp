import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';
import { Plus, Filter, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
import DocumentForm from './DocumentForm';

const DocumentList: React.FC = () => {
  const { state } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Filter documents
  const filteredDocuments = state.documents.filter(doc => {
    // Get associated case for search
    const associatedCase = state.cases.find(c => c.caseId === doc.caseId);
    
    const matchesSearch = 
      doc.fileURL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (associatedCase && (
        associatedCase.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        associatedCase.defendant.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesType = typeFilter ? doc.type === typeFilter : true;
    const matchesStatus = statusFilter ? doc.status === statusFilter : true;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort by newest first
  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Paginate
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setSelectedDocument(null);
    setIsModalOpen(true);
  };

  const openEditModal = (docId: string) => {
    setSelectedDocument(docId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

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
      accessor: (item: typeof state.documents[0]) => (
        <div className="flex items-center">
          <FileText size={18} className="text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-700">{item.type}</div>
            <div className="text-gray-500 text-sm truncate max-w-xs">
              {item.fileURL.split('/').pop()}
            </div>
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      header: 'Case',
      accessor: (item: typeof state.documents[0]) => {
        const associatedCase = state.cases.find(c => c.caseId === item.caseId);
        return associatedCase 
          ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` 
          : 'Unknown Case';
      },
      sortable: false,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.documents[0]) => (
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
      accessor: (item: typeof state.documents[0]) => 
        item.serviceDate ? format(new Date(item.serviceDate), 'MMM d, yyyy') : 'Not served',
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage legal documents and track their service status
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
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

        <Table 
          data={paginatedDocuments}
          columns={columns}
          keyField="docId"
          onRowClick={(item) => openEditModal(item.docId)}
          emptyMessage="No documents found. Add a new document to get started."
        />
        
        <Pagination
          totalItems={filteredDocuments.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {isModalOpen && (
        <DocumentForm 
          isOpen={isModalOpen}
          onClose={closeModal}
          docId={selectedDocument}
        />
      )}
    </div>
  );
};

export default DocumentList;