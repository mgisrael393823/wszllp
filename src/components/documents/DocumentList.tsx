import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { useDocuments } from '../../hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';

interface Document {
  docId: string;
  type: string;
  fileURL: string;
  originalFilename?: string;
  status: string;
  serviceDate?: string;
  case?: {
    plaintiff: string;
    defendant: string;
  };
}

interface DocumentListProps {
  limit?: number;
  caseId?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ limit, caseId }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { state } = useData();

  // Check if we have local documents from DataContext
  const hasLocalDocuments = state.documents.length > 0;

  // Memoize filters to prevent infinite re-renders
  const filters = React.useMemo(() => ({
    caseId: caseId || undefined
  }), [caseId]);

  // Use the existing useDocuments hook (will be ignored if we have local data)
  const { 
    documents: apiDocuments, 
    isLoading: apiLoading, 
    error: apiError, 
    totalCount 
  } = useDocuments(limit, filters, 1, limit || 10);

  // Use local documents first, fallback to API data
  const documents = hasLocalDocuments ? state.documents : apiDocuments;
  const isLoading = hasLocalDocuments ? false : apiLoading;
  const error = hasLocalDocuments ? null : apiError;

  // Show error toast if data fetching fails
  React.useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: 'Error Loading Documents',
        message: error.message || 'Failed to load documents. Please try again.',
        duration: 5000
      });
    }
  }, [error, addToast]);

  // Helper function to get display filename
  const getDisplayFileName = (item: Document): string => {
    // First try the original filename if it exists
    if (item.originalFilename) {
      return item.originalFilename;
    }
    
    // Fallback to extracting from URL
    const url = item.fileURL;
    if (!url) return 'Unknown file';
    
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      // If it's a generated filename (timestamp-hash.ext), make it more readable
      if (fileName.match(/^\d+-[a-z0-9]+\./)) {
        const ext = fileName.split('.').pop();
        return `${item.type.toLowerCase()}_document.${ext}`;
      }
      
      return decodeURIComponent(fileName);
    } catch {
      return url.substring(url.lastIndexOf('/') + 1) || 'document';
    }
  };

  // Column definitions for TanStack Table
  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: 'type',
      header: 'Document',
      cell: ({ row }) => {
        const fileName = getDisplayFileName(row.original);
        return (
          <div className="flex items-center">
            <FileText size={18} className="text-neutral-400 mr-2" />
            <div>
              <div className="font-medium text-neutral-700">{row.original.type}</div>
              <div className="text-neutral-500 text-sm truncate max-w-xs">
                <a 
                  href={row.original.fileURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  title={`Download ${fileName}`}
                >
                  {fileName}
                </a>
              </div>
            </div>
          </div>
        );
      },
      meta: {
        filterVariant: 'select',
      },
    },
    {
      accessorKey: 'case',
      header: 'Case',
      cell: ({ row }) => (
        row.original.case 
          ? `${row.original.case.plaintiff} v. ${row.original.case.defendant}` 
          : 'Unknown Case'
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'Pending':
              return 'bg-yellow-100 text-yellow-800';
            case 'Served':
              return 'bg-green-100 text-green-800';
            case 'Failed':
              return 'bg-red-100 text-red-800';
            default:
              return 'bg-neutral-100 text-neutral-800';
          }
        };
        
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
          >
            {status}
          </span>
        );
      },
      meta: {
        filterVariant: 'select',
      },
    },
    {
      accessorKey: 'serviceDate',
      header: 'Service Date',
      cell: ({ row }) => (
        row.original.serviceDate 
          ? new Date(row.original.serviceDate).toLocaleDateString() 
          : 'Not served'
      ),
      meta: {
        filterVariant: 'text',
      },
    },
  ];

  // Handle empty state for limited view
  if (limit && !isLoading && documents.length === 0 && !error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <FileText size={64} className="mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No documents found</h3>
        <p className="text-neutral-500">Add a new document to get started.</p>
      </div>
    );
  }

  return (
    <DataTable
      data={documents}
      columns={columns}
      isLoading={isLoading}
      error={error}
      onRowClick={(row) => navigate(`/documents/${row.docId}`)}
      enableRowSelection
      className={limit ? "border-0 shadow-none" : undefined}
    />
  );
};

export default DocumentList;