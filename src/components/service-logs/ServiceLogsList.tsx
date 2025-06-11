import React from 'react';
import { Truck, Calendar } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { useData } from '../../context/DataContext';
import { format, parseISO, isValid } from 'date-fns';

interface ServiceLog {
  logId: string;
  docId: string;
  method: string;
  attemptDate: string | Date;
  result: string;
  notes?: string;
}

interface ServiceLogDisplay extends ServiceLog {
  documentType: string;
  caseTitle: string;
  attemptDateFormatted: string;
}

const ServiceLogsList: React.FC = () => {
  const { state } = useData();

  // Process service logs with document and case information
  const processedLogs: ServiceLogDisplay[] = React.useMemo(() => {
    return state.serviceLogs.map(log => {
      // Get associated document
      const document = state.documents.find(d => d.docId === log.docId);
      // Get associated case if document exists
      const associatedCase = document ? state.cases.find(c => c.caseId === document.caseId) : null;
      
      const formatDate = (date: string | Date) => {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        return parsedDate && isValid(parsedDate) 
          ? format(parsedDate, 'MMM d, yyyy h:mm a') 
          : 'Invalid Date';
      };

      return {
        ...log,
        documentType: document ? document.type : 'Unknown Document',
        caseTitle: associatedCase 
          ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` 
          : 'Unknown Case',
        attemptDateFormatted: formatDate(log.attemptDate)
      };
    }).sort((a, b) => {
      // Sort by newest attempt date first
      const dateA = typeof a.attemptDate === 'string' ? parseISO(a.attemptDate) : a.attemptDate;
      const dateB = typeof b.attemptDate === 'string' ? parseISO(b.attemptDate) : b.attemptDate;
      const timeA = dateA && isValid(dateA) ? dateA.getTime() : 0;
      const timeB = dateB && isValid(dateB) ? dateB.getTime() : 0;
      return timeB - timeA;
    });
  }, [state.serviceLogs, state.documents, state.cases]);

  // Column definitions for TanStack Table
  const columns: ColumnDef<ServiceLogDisplay>[] = [
    {
      accessorKey: 'documentType',
      header: 'Document',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'caseTitle',
      header: 'Case',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-neutral-700">
          <Truck className="w-3 h-3" />
          <span>{row.original.method}</span>
        </div>
      ),
      meta: {
        filterVariant: 'select',
      },
    },
    {
      accessorKey: 'attemptDateFormatted',
      header: 'Attempt Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-neutral-600">
          <Calendar className="w-3 h-3" />
          <span>{row.original.attemptDateFormatted}</span>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => {
        const result = row.original.result;
        const isSuccess = result === 'Success';
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {result}
          </span>
        );
      },
      meta: {
        filterVariant: 'select',
      },
    },
  ];

  // Handle empty state
  if (processedLogs.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <Truck size={64} className="mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No service logs found</h3>
        <p className="text-neutral-500">Add a new service log to get started.</p>
      </div>
    );
  }

  return (
    <DataTable
      data={processedLogs}
      columns={columns}
      isLoading={false}
      error={null}
      onRowClick={(row) => {
        // Note: There's no detail page for service logs, so we'll just handle this generically
        console.log('Selected service log:', row.logId);
      }}
      enableRowSelection
    />
  );
};

export default ServiceLogsList;