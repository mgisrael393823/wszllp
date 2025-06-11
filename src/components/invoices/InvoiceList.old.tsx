import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { format, parseISO, isValid } from 'date-fns';
import { Plus, DollarSign } from 'lucide-react';
import { Card, Button, Table, Pagination, FilterBar } from '../ui';
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
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const dateA = typeof a.issueDate === 'string'
      ? parseISO(a.issueDate)
      : a.issueDate instanceof Date
      ? a.issueDate
      : null;
    const dateB = typeof b.issueDate === 'string'
      ? parseISO(b.issueDate)
      : b.issueDate instanceof Date
      ? b.issueDate
      : null;
    const timeA = dateA && isValid(dateA) ? dateA.getTime() : 0;
    const timeB = dateB && isValid(dateB) ? dateB.getTime() : 0;
    return timeB - timeA;
  });

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
      const date = typeof invoice.issueDate === 'string'
        ? parseISO(invoice.issueDate)
        : invoice.issueDate instanceof Date
        ? invoice.issueDate
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
      accessor: (item: typeof state.invoices[0]) => {
        const date = typeof item.issueDate === 'string'
          ? parseISO(item.issueDate)
          : item.issueDate instanceof Date
          ? item.issueDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
      sortable: true,
    },
    {
      header: 'Due Date',
      accessor: (item: typeof state.invoices[0]) => {
        const date = typeof item.dueDate === 'string'
          ? parseISO(item.dueDate)
          : item.dueDate instanceof Date
          ? item.dueDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
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
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">
            Manage billing and payment records
          </p>
        </div>
        <div className="page-actions">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search cases..."
            primaryFilter={{
              value: paidFilter,
              onChange: setPaidFilter,
              options: [
                { value: '', label: 'All Status' },
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Unpaid' }
              ],
              placeholder: "All Status"
            }}
            secondaryFilter={{
              value: dateFilter,
              onChange: setDateFilter,
              options: getDateFilterOptions(),
              placeholder: "All Dates",
              icon: <DollarSign className="icon-standard text-neutral-400" />
            }}
          />
          
          <Button onClick={openAddModal} icon={<Plus size={16} />}>
            Add Invoice
          </Button>
        </div>
      </div>

      <Card>

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