import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';
import { Plus, Filter, Search, DollarSign } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Input from '../ui/Input';
import InvoiceForm from './InvoiceForm';
import { formatCurrency } from '../../utils/utils';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paidFilter, setPaidFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const itemsPerPage = 10;

  // Filter invoices
  const filteredInvoices = state.invoices.filter(invoice => {
    const associatedCase = state.cases.find(c => c.caseId === invoice.caseId);
    
    const matchesSearch = associatedCase && (
      associatedCase.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      associatedCase.defendant.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesPaid = paidFilter === '' ? true : 
      paidFilter === 'paid' ? invoice.paid : !invoice.paid;
    
    const matchesDate = dateFilter ? invoice.issueDate.startsWith(dateFilter) : true;
    
    return matchesSearch && matchesPaid && matchesDate;
  });

  // Sort by newest first
  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
  );

  // Paginate
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
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
    
    state.invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
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
      accessor: (item: typeof state.invoices[0]) => {
        const associatedCase = state.cases.find(c => c.caseId === item.caseId);
        return associatedCase 
          ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` 
          : 'Unknown Case';
      },
      sortable: false,
    },
    {
      header: 'Amount',
      accessor: (item: typeof state.invoices[0]) => formatCurrency(item.amount),
      sortable: true,
    },
    {
      header: 'Issue Date',
      accessor: (item: typeof state.invoices[0]) => 
        format(new Date(item.issueDate), 'MMM d, yyyy'),
      sortable: true,
    },
    {
      header: 'Due Date',
      accessor: (item: typeof state.invoices[0]) => 
        format(new Date(item.dueDate), 'MMM d, yyyy'),
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.invoices[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }
        >
          {item.paid ? 'Paid' : 'Unpaid'}
        </span>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage billing and payment records
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
          Add Invoice
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
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            
            <DollarSign size={16} className="text-gray-400 ml-2" />
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
          data={paginatedInvoices}
          columns={columns}
          keyField="invoiceId"
          onRowClick={(item) => navigate(`/invoices/${item.invoiceId}`)}
          emptyMessage="No invoices found. Add a new invoice to get started."
        />
        
        <Pagination
          totalItems={filteredInvoices.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {isModalOpen && (
        <InvoiceForm 
          isOpen={isModalOpen}
          onClose={closeModal}
          invoiceId={selectedInvoice}
        />
      )}
    </div>
  );
};

export default InvoiceList;