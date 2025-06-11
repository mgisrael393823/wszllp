import React from 'react';
import { DollarSign } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
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

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useData();

  // Process invoices with case information
  const processedInvoices: InvoiceDisplay[] = React.useMemo(() => {
    return state.invoices.map(invoice => {
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
    }).sort((a, b) => {
      // Sort by newest first
      const dateA = typeof a.issueDate === 'string' ? parseISO(a.issueDate) : a.issueDate;
      const dateB = typeof b.issueDate === 'string' ? parseISO(b.issueDate) : b.issueDate;
      const timeA = dateA && isValid(dateA) ? dateA.getTime() : 0;
      const timeB = dateB && isValid(dateB) ? dateB.getTime() : 0;
      return timeB - timeA;
    });
  }, [state.invoices, state.cases]);

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

  // Handle empty state
  if (processedInvoices.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <DollarSign size={64} className="mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No invoices found</h3>
        <p className="text-neutral-500">Add a new invoice to get started.</p>
      </div>
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