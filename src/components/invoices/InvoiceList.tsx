import React from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { EmptyState } from '../ui';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { formatCurrency } from '../../utils/utils';

interface Invoice {
  invoiceId: string;
  caseId: string;
  amount: number;
  issueDate: string | Date;
  dueDate: string | Date;
  paid: boolean;
}

interface InvoiceDisplay extends Invoice {
  caseTitle: string;
  amountFormatted: string;
  issueDateFormatted: string;
  dueDateFormatted: string;
  status: string;
}

interface InvoiceListProps {
  onAddInvoice?: () => void;
  statusFilter?: 'all' | 'unpaid' | 'paid' | 'overdue';
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onAddInvoice, statusFilter = 'all' }) => {
  const navigate = useNavigate();
  const { state } = useData();

  // Process invoices with case information and apply status filtering
  const processedInvoices: InvoiceDisplay[] = React.useMemo(() => {
    const now = new Date();
    
    const allProcessed = state.invoices.map(invoice => {
      const associatedCase = state.cases.find(c => c.caseId === invoice.caseId);
      
      const formatDate = (date: string | Date) => {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        return parsedDate && isValid(parsedDate) 
          ? format(parsedDate, 'MMM d, yyyy') 
          : 'Invalid Date';
      };

      return {
        ...invoice,
        caseTitle: associatedCase 
          ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` 
          : 'Unknown Case',
        amountFormatted: formatCurrency(invoice.amount),
        issueDateFormatted: formatDate(invoice.issueDate),
        dueDateFormatted: formatDate(invoice.dueDate),
        status: invoice.paid ? 'Paid' : 'Unpaid'
      };
    });

    // Apply status filtering
    const filtered = allProcessed.filter(invoice => {
      switch (statusFilter) {
        case 'unpaid':
          return !invoice.paid;
        case 'paid':
          return invoice.paid;
        case 'overdue':
          if (invoice.paid) return false;
          const dueDate = typeof invoice.dueDate === 'string' 
            ? parseISO(invoice.dueDate) 
            : invoice.dueDate;
          return dueDate && isValid(dueDate) && dueDate < now;
        case 'all':
        default:
          return true;
      }
    });

    // Sort by newest first
    return filtered.sort((a, b) => {
      const dateA = typeof a.issueDate === 'string' ? parseISO(a.issueDate) : a.issueDate;
      const dateB = typeof b.issueDate === 'string' ? parseISO(b.issueDate) : b.issueDate;
      const timeA = dateA && isValid(dateA) ? dateA.getTime() : 0;
      const timeB = dateB && isValid(dateB) ? dateB.getTime() : 0;
      return timeB - timeA;
    });
  }, [state.invoices, state.cases, statusFilter]);

  // Column definitions for TanStack Table
  const columns: ColumnDef<InvoiceDisplay>[] = [
    {
      accessorKey: 'caseTitle',
      header: 'Case',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'amountFormatted',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-neutral-900 font-medium">
          <DollarSign className="w-3 h-3" />
          <span>{row.original.amountFormatted}</span>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'issueDateFormatted',
      header: 'Issue Date',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'dueDateFormatted',
      header: 'Due Date',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isPaid = row.original.paid;
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {row.original.status}
          </span>
        );
      },
      meta: {
        filterVariant: 'select',
      },
    },
  ];

  // Handle empty state with design system component
  if (processedInvoices.length === 0) {
    const getEmptyStateContent = () => {
      switch (statusFilter) {
        case 'unpaid':
          return {
            title: "No unpaid invoices",
            description: "All invoices have been paid! Great job staying on top of collections."
          };
        case 'paid':
          return {
            title: "No paid invoices",
            description: "No payments have been recorded yet. Paid invoices will appear here."
          };
        case 'overdue':
          return {
            title: "No overdue invoices",
            description: "Excellent! All invoices are current with no overdue payments."
          };
        default:
          return {
            title: "No invoices found",
            description: "Create your first invoice to start tracking billing and payments for your cases."
          };
      }
    };

    const { title, description } = getEmptyStateContent();

    return (
      <EmptyState
        icon={<DollarSign className="w-16 h-16 text-neutral-400" />}
        title={title}
        description={description}
        action={onAddInvoice && statusFilter === 'all' ? {
          label: "Add Invoice",
          onClick: onAddInvoice,
          variant: "primary" as const,
          icon: <Plus size={16} />
        } : undefined}
      />
    );
  }

  return (
    <DataTable
      data={processedInvoices}
      columns={columns}
      isLoading={false}
      error={null}
      onRowClick={(row) => navigate(`/invoices/${row.invoiceId}`)}
      enableRowSelection
    />
  );
};

export default InvoiceList;