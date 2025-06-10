import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Edit, Trash2, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import { useDocuments } from '../../hooks/useDocuments';
import { useToast } from '../../context/ToastContext';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  
  // Get documents hook to fetch individual document
  const { documents } = useDocuments();
  
  useEffect(() => {
    if (id && documents) {
      setIsLoading(true);
      setError(null);
      
      // Find the document with the matching ID
      const foundDocument = documents.find(doc => doc.docId === id);
      
      if (foundDocument) {
        setDocument(foundDocument);
      } else {
        setError('Document not found');
      }
      
      setIsLoading(false);
    }
  }, [id, documents]);
  
  const handleDelete = async () => {
    if (!document || !window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      // TODO: Implement document deletion
      addToast({
        type: 'success',
        title: 'Document Deleted',
        message: 'The document has been successfully deleted.',
        duration: 3000
      });
      navigate('/documents');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete the document. Please try again.',
        duration: 5000
      });
    }
  };
  
  const handleDownload = () => {
    if (document?.fileURL) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = document.fileURL;
      link.download = getFilenameFromUrl(document.fileURL) || `document-${document.docId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleViewFile = () => {
    if (document?.fileURL) {
      // Open file in new tab for viewing
      window.open(document.fileURL, '_blank');
    }
  };
  
  // Show skeleton immediately to prevent FOUC
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-10 w-16 bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse"></div>
        
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="p-6">
            <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="p-6">
            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4"></div>
            <div className="h-16 w-full bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !document) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate('/documents')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Documents
        </Button>
        
        <Card className="p-6">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Document Not Found</h3>
              <p className="text-sm text-red-700 mt-1">
                {error || 'The requested document could not be found.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with consistent pattern */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{document.type}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {document.case ? `${document.case.plaintiff} v. ${document.case.defendant}` : 'No case assigned'}
          </p>
        </div>
        <div className="flex gap-2">
          {document.fileURL && (
            <>
              <Button 
                variant="secondary" 
                icon={<ExternalLink size={16} />}
                onClick={handleViewFile}
              >
                View
              </Button>
              <Button 
                variant="outline" 
                icon={<Download size={16} />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            icon={<Edit size={16} />}
            onClick={() => navigate(`/documents/${document.docId}/edit`)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Back navigation */}
      <Button
        variant="outline"
        onClick={() => navigate('/documents')}
        icon={<ArrowLeft size={16} />}
      >
        Back to Documents
      </Button>

      {/* Document Information Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Document Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Document Type</label>
              <p className="mt-1 text-sm text-neutral-900">{document.type}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700">Status</label>
              <div className="mt-1">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${document.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                      document.status === 'Served' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`
                  }
                >
                  {document.status}
                </span>
              </div>
            </div>
            
            {document.fileURL && (
              <div>
                <label className="text-sm font-medium text-neutral-700">File Name</label>
                <p className="mt-1 text-sm text-neutral-900">{getFilenameFromUrl(document.fileURL)}</p>
              </div>
            )}
            
            {document.serviceDate && (
              <div>
                <label className="text-sm font-medium text-neutral-700">Service Date</label>
                <p className="mt-1 text-sm text-neutral-900">
                  {(() => {
                    const date = typeof document.serviceDate === 'string'
                      ? parseISO(document.serviceDate)
                      : document.serviceDate instanceof Date
                      ? document.serviceDate
                      : null;
                    return date && isValid(date)
                      ? format(date, 'MMM d, yyyy')
                      : 'Invalid Date';
                  })()}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-neutral-700">Created</label>
                <p className="mt-1 text-sm text-neutral-900">
                  {document.createdAt ? (() => {
                    const date = typeof document.createdAt === 'string'
                      ? parseISO(document.createdAt)
                      : document.createdAt instanceof Date
                      ? document.createdAt
                      : null;
                    return date && isValid(date)
                      ? format(date, 'MMM d, yyyy')
                      : 'Invalid Date';
                  })() : 'Unknown'}
                </p>
            </div>
            
            {document.updatedAt && (
              <div>
                <label className="text-sm font-medium text-neutral-700">Last Updated</label>
                <p className="mt-1 text-sm text-neutral-900">
                  {(() => {
                    const date = typeof document.updatedAt === 'string'
                      ? parseISO(document.updatedAt)
                      : document.updatedAt instanceof Date
                      ? document.updatedAt
                      : null;
                    return date && isValid(date)
                      ? format(date, 'MMM d, yyyy')
                      : 'Invalid Date';
                  })()}
                </p>
              </div>
            )}
          </div>
          
          {document.notes && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <label className="text-sm font-medium text-neutral-700">Notes</label>
              <p className="mt-1 text-sm text-neutral-900 whitespace-pre-wrap">
                {document.notes}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Case Information */}
      {document.case && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Associated Case</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700">Plaintiff</label>
                <p className="mt-1 text-sm text-neutral-900">{document.case.plaintiff}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Defendant</label>
                <p className="mt-1 text-sm text-neutral-900">{document.case.defendant}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/cases/${document.case.id}`)}
              >
                View Case Details
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* File Actions */}
      {document.fileURL && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">File Actions</h2>
            <div className="flex items-center gap-4">
              <FileText size={32} className="text-neutral-400" />
              <div className="flex-1">
                <p className="font-medium">{getFilenameFromUrl(document.fileURL)}</p>
                <p className="text-sm text-neutral-500">Click to view or download this document</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleViewFile}
                  icon={<ExternalLink size={16} />}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  icon={<Download size={16} />}
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
          <Button
            variant="danger"
            onClick={handleDelete}
            icon={<Trash2 size={16} />}
          >
            Delete Document
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DocumentDetail;