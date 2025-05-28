import React, { useState, useMemo, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Card, Table, Pagination, FilterBar, ErrorState } from '../ui';
import { useData } from '../../context/DataContext';
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

  // Use DataContext for documents (handles sandbox routing)
  const { state } = useData();
  const [error, setError] = useState<Error | null>(null);

  // Process documents from DataContext with useMemo for performance
  const processedDocuments = useMemo(() => {
    let docs = state.documents;

    // Apply case filter if specified
    if (caseId) {
      docs = docs.filter(doc => doc.caseId === caseId);
    }

    // Apply type filter
    if (typeFilter) {
      docs = docs.filter(doc => doc.type === typeFilter);
    }

    // Apply status filter  
    if (statusFilter) {
      docs = docs.filter(doc => doc.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      docs = docs.filter(doc => 
        doc.fileURL?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Add case information to documents
    return docs.map(doc => {
      const caseInfo = state.cases.find(c => c.caseId === doc.caseId);
      return {
        ...doc,
        case: caseInfo ? {
          plaintiff: caseInfo.plaintiff,
          defendant: caseInfo.defendant
        } : {
          plaintiff: 'Unknown',
          defendant: 'Unknown'
        }
      };
    });
  }, [state.documents, state.cases, caseId, typeFilter, statusFilter, searchTerm]);
  const isLoading = state.documents.length === 0 && state.cases.length === 0;

  // Pagination and limiting
  const totalCount = processedDocuments.length;
  const documents = useMemo(() => {
    if (limit) return processedDocuments.slice(0, limit);
    const start = (currentPage - 1) * itemsPerPage;
    return processedDocuments.slice(start, start + itemsPerPage);
  }, [processedDocuments, limit, currentPage]);
  
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
  const columns = useMemo(() => [
    {
      header: 'Document',
      accessor: (item: any) => {
        // Use original filename if available, otherwise extract from URL
        const getDisplayFileName = (item: any): string => {
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

        const fileName = getDisplayFileName(item);
        return (
          <div className="flex items-center">
            <FileText size={18} className="text-neutral-400 mr-2" />
            <div>
              <div className="font-medium text-neutral-700">{item.type}</div>
              <div className="text-neutral-500 text-sm truncate max-w-xs">
                <a 
                  href={item.fileURL} 
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
  ], []);

  // Error display component
  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <AlertCircle size={20} className="text-red-500 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error loading documents</h3>
          <p className="text-sm text-red-700 mt-1">
            {typeof error === 'string' ? error : error?.message || 'Failed to load documents. Please try again.'}
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
        {error && (
          <ErrorState 
            title="Error loading documents"
            message={typeof error === 'string' ? error : error?.message || 'Failed to load documents. Please try again.'}
          />
        )}
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              {[1, 2].map(i => (
                <div key={i} className="px-4 py-3 border-b">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
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
    <Card>
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search documents..."
        primaryFilter={{
          value: typeFilter,
          onChange: setTypeFilter,
          options: typeOptions,
          placeholder: "All Types",
          icon: <FileText className="icon-standard text-neutral-400" />
        }}
        secondaryFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: statusOptions,
          placeholder: "All Statuses"
        }}
      />

      {error && (
        <ErrorState 
          title="Error loading documents"
          message={typeof error === 'string' ? error : error?.message || 'Failed to load documents. Please try again.'}
        />
      )}
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3 border-b">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
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
  );
};

export default React.memo(DocumentList);
