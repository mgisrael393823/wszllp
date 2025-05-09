import React, { useState } from 'react';
import { Plus, Filter, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';

const DocumentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Mock documents data
  const documents = [
    {
      docId: '1',
      type: 'Complaint',
      caseTitle: 'Smith Property v. John Doe',
      fileURL: 'smith_vs_doe_complaint.pdf',
      status: 'Served',
      serviceDate: '2023-05-05',
      createdAt: '2023-05-01'
    },
    {
      docId: '2',
      type: 'Summons',
      caseTitle: 'Smith Property v. John Doe',
      fileURL: 'smith_vs_doe_summons.pdf',
      status: 'Served',
      serviceDate: '2023-05-05',
      createdAt: '2023-05-01'
    },
    {
      docId: '3',
      type: 'Complaint',
      caseTitle: 'Oak Apartments v. Jane Smith',
      fileURL: 'oak_vs_smith_complaint.pdf',
      status: 'Served',
      serviceDate: '2023-05-06',
      createdAt: '2023-05-02'
    },
    {
      docId: '4',
      type: 'Summons',
      caseTitle: 'Oak Apartments v. Jane Smith',
      fileURL: 'oak_vs_smith_summons.pdf',
      status: 'Served',
      serviceDate: '2023-05-06',
      createdAt: '2023-05-02'
    },
    {
      docId: '5',
      type: 'Complaint',
      caseTitle: 'Riverside Properties v. Michael Johnson',
      fileURL: 'riverside_vs_johnson_complaint.pdf',
      status: 'Pending',
      serviceDate: null,
      createdAt: '2023-05-10'
    },
    {
      docId: '6',
      type: 'Affidavit',
      caseTitle: 'Smith Property v. John Doe',
      fileURL: 'smith_vs_doe_affidavit.pdf',
      status: 'Pending',
      serviceDate: null,
      createdAt: '2023-05-12'
    },
    {
      docId: '7',
      type: 'Motion',
      caseTitle: 'Smith Property v. John Doe',
      fileURL: 'smith_vs_doe_motion_for_default.pdf',
      status: 'Pending',
      serviceDate: null,
      createdAt: '2023-05-15'
    },
    {
      docId: '8',
      type: 'Order',
      caseTitle: 'Oak Apartments v. Jane Smith',
      fileURL: 'oak_vs_smith_eviction_order.pdf',
      status: 'Failed',
      serviceDate: null,
      createdAt: '2023-05-18'
    }
  ];

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.fileURL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.caseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter ? doc.type === typeFilter : true;
    const matchesStatus = statusFilter ? doc.status === statusFilter : true;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginate
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      accessor: (item: typeof documents[0]) => (
        <div className="flex items-center">
          <FileText size={18} className="text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-700">{item.type}</div>
            <div className="text-gray-500 text-sm truncate max-w-xs">
              {item.fileURL}
            </div>
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      header: 'Case',
      accessor: 'caseTitle',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof documents[0]) => (
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
      accessor: (item: typeof documents[0]) => 
        item.serviceDate ? new Date(item.serviceDate).toLocaleDateString() : 'Not served',
      sortable: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage legal documents and track their service status
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
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
          onRowClick={(item) => console.log('Clicked document:', item.docId)}
          emptyMessage="No documents found. Add a new document to get started."
        />
        
        <Pagination
          totalItems={filteredDocuments.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};

export default DocumentList;