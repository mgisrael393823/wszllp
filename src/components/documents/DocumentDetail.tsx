import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Edit, Trash2, FileText, User, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useDocuments } from '../../hooks/useDocuments';
import { useToast } from '../../context/ToastContext';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DocumentDetailProps {}

const DocumentDetail: React.FC<DocumentDetailProps> = () => {
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
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-32 bg-neutral-200 rounded"></div>
            <div className="h-8 w-64 bg-neutral-200 rounded"></div>
          </div>
          <div className="h-96 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !document) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="text"
            onClick={() => navigate('/documents')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Documents
          </Button>
        </div>
        
        <Card variant="error" className="p-6">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-error-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-error-800 mb-1">Document Not Found</h3>
              <p className="text-sm text-error-700">
                {error || 'The requested document could not be found.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Section */}
      <div className="mb-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="text"
            onClick={() => navigate('/documents')}
            icon={<ArrowLeft size={16} />}
            className="px-0"
          >
            Back to Documents
          </Button>
        </div>

        {/* Page Title and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {document.type}
            </h1>
            <p className="text-base text-neutral-600">
              {document.case ? `${document.case.plaintiff} v. ${document.case.defendant}` : 'No case assigned'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {document.fileURL && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleViewFile}
                  icon={<ExternalLink size={16} />}
                  className="min-w-24"
                >
                  View File
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  icon={<Download size={16} />}
                  className="min-w-24"
                >
                  Download
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/documents/${document.docId}/edit`)}
              icon={<Edit size={16} />}
              className="min-w-16"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              icon={<Trash2 size={16} />}
              className="min-w-20"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Primary Content - Document Details */}
        <div className="lg:col-span-3">
          <Card className="p-6 mb-6">
            <div className="flex items-center mb-6">
              <FileText size={20} className="text-primary-600 mr-3 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-neutral-900 leading-none">Document Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-neutral-700">Document Type</dt>
                  <dd className="text-base text-neutral-900 mt-1">{document.type}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-neutral-700">Status</dt>
                  <dd className="mt-1">
                    <span 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${document.status === 'Pending' ? 'bg-warning-100 text-warning-800' : 
                          document.status === 'Served' ? 'bg-success-100 text-success-800' : 
                            'bg-error-100 text-error-800'}`
                      }
                    >
                      {document.status}
                    </span>
                  </dd>
                </div>
                
                {document.fileURL && (
                  <div>
                    <dt className="text-sm font-medium text-neutral-700">File Name</dt>
                    <dd className="text-base text-neutral-900 mt-1 break-words">
                      {getFilenameFromUrl(document.fileURL)}
                    </dd>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {document.serviceDate && (
                  <div>
                    <dt className="text-sm font-medium text-neutral-700">Service Date</dt>
                    <dd className="text-base text-neutral-900 mt-1">
                      {format(new Date(document.serviceDate), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-neutral-700">Created</dt>
                  <dd className="text-base text-neutral-900 mt-1">
                    {document.createdAt ? format(new Date(document.createdAt), 'MMMM d, yyyy') : 'Unknown'}
                  </dd>
                </div>
                
                {document.updatedAt && (
                  <div>
                    <dt className="text-sm font-medium text-neutral-700">Last Updated</dt>
                    <dd className="text-base text-neutral-900 mt-1">
                      {format(new Date(document.updatedAt), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                )}
              </div>
            </div>
            
            {document.notes && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <dt className="text-sm font-medium text-neutral-700 mb-2">Notes</dt>
                <dd className="text-base text-neutral-900 whitespace-pre-wrap">
                  {document.notes}
                </dd>
              </div>
            )}
          </Card>

          {/* File Preview Section */}
          {document.fileURL && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Eye size={20} className="text-primary-600 mr-3 flex-shrink-0" />
                <h2 className="text-xl font-semibold text-neutral-900 leading-none">File Preview</h2>
              </div>
              
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-neutral-50">
                <FileText size={64} className="mx-auto text-neutral-400 mb-4" />
                <p className="text-lg font-medium text-neutral-900 mb-2">
                  {getFilenameFromUrl(document.fileURL) || 'Document file'}
                </p>
                <p className="text-sm text-neutral-600 mb-6">
                  Click to view or download this document
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button
                    variant="primary"
                    onClick={handleViewFile}
                    icon={<ExternalLink size={16} />}
                    className="min-w-32"
                  >
                    Open File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    icon={<Download size={16} />}
                    className="min-w-32"
                  >
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        {/* Sidebar - Case Information */}
        <div className="lg:col-span-1">
          {document.case && (
            <Card className="p-6 mb-6">
              <div className="flex items-center mb-4">
                <User size={18} className="text-primary-600 mr-3 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-neutral-900 leading-none">
                  Associated Case
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-neutral-700">Plaintiff</dt>
                  <dd className="text-sm text-neutral-900 mt-1">{document.case.plaintiff}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-neutral-700">Defendant</dt>
                  <dd className="text-sm text-neutral-900 mt-1">{document.case.defendant}</dd>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => navigate(`/cases/${document.case.id}`)}
                  className="w-full mt-4"
                >
                  View Case Details
                </Button>
              </div>
            </Card>
          )}
          
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 leading-none">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/documents/${document.docId}/edit`)}
                icon={<Edit size={16} />}
                className="w-full justify-start"
              >
                Edit Document
              </Button>
              
              {document.fileURL && (
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  icon={<Download size={16} />}
                  className="w-full justify-start"
                >
                  Download File
                </Button>
              )}
              
              <Button
                variant="danger"
                onClick={handleDelete}
                icon={<Trash2 size={16} />}
                className="w-full justify-start"
              >
                Delete Document
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;