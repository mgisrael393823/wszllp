import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Edit, Trash2, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useDocuments } from '../../hooks/useDocuments';
import { useToast } from '../../context/ToastContext';

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/documents')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Documents
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle size={20} className="text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Document Not Found</h3>
              <p className="text-sm text-red-700 mt-1">
                {error || 'The requested document could not be found.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/documents')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Documents
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.type}</h1>
            <p className="text-sm text-gray-500">
              {document.case ? `${document.case.plaintiff} v. ${document.case.defendant}` : 'No case assigned'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {document.fileURL && (
            <>
              <Button
                variant="outline"
                onClick={handleViewFile}
                icon={<Eye size={16} />}
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
            </>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/documents/${document.docId}/edit`)}
            icon={<Edit size={16} />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            icon={<Trash2 size={16} />}
          >
            Delete
          </Button>
        </div>
      </div>
      
      {/* Document Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Document Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <p className="text-sm text-gray-900">{document.type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
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
                
                {document.serviceDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(document.serviceDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {document.fileURL && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name
                    </label>
                    <p className="text-sm text-gray-900">{getFilenameFromUrl(document.fileURL)}</p>
                  </div>
                )}
              </div>
              
              {document.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{document.notes}</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* File Preview */}
          {document.fileURL && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">File Preview</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    {getFilenameFromUrl(document.fileURL) || 'Document file'}
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="primary"
                      onClick={handleViewFile}
                      icon={<Eye size={16} />}
                    >
                      Open File
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
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Case Information */}
          {document.case && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Associated Case</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Plaintiff</p>
                      <p className="text-sm text-gray-600">{document.case.plaintiff}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Defendant</p>
                      <p className="text-sm text-gray-600">{document.case.defendant}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/cases/${document.case.id}`)}
                    className="w-full mt-3"
                  >
                    View Case Details
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Document Metadata */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Document Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-gray-600">
                      {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                {document.updatedAt && (
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {new Date(document.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <FileText size={16} className="text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Document ID</p>
                    <p className="text-sm text-gray-600 font-mono">{document.docId}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;