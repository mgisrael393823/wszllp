import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { createDocument } from '../../hooks/useDocuments';
import Button from '../ui/Button';
import { Card } from '../ui/shadcn-card';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Typography from '../ui/Typography';

interface DocumentUploadFormProps {
  caseId?: string;
  onUploadSuccess?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ 
  caseId, 
  onUploadSuccess 
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [documentType, setDocumentType] = useState('Other');
  const [documentStatus, setDocumentStatus] = useState('Pending');
  const [serviceDate, setServiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cases, setCases] = useState<{ caseId: string; plaintiff: string; defendant: string; }[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  // Fetch cases from Supabase
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, plaintiff, defendant')
          .order('createdat', { ascending: false });

        if (error) throw error;

        const formattedCases = (data || []).map(c => ({
          caseId: c.id,
          plaintiff: c.plaintiff,
          defendant: c.defendant
        }));

        setCases(formattedCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
        addToast({
          type: 'error',
          title: 'Error Loading Cases',
          message: 'Failed to load cases. Please refresh the page.',
          duration: 5000
        });
      } finally {
        setIsLoadingCases(false);
      }
    };

    fetchCases();
  }, [addToast]);

  const documentTypes = [
    { value: 'Complaint', label: 'Complaint' },
    { value: 'Summons', label: 'Summons' },
    { value: 'Affidavit', label: 'Affidavit' },
    { value: 'Motion', label: 'Motion' },
    { value: 'Order', label: 'Order' },
    { value: 'Other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Served', label: 'Served' },
    { value: 'Failed', label: 'Failed' },
  ];

  const caseOptions = cases.map(c => ({
    value: c.caseId,
    label: `${c.plaintiff} v. ${c.defendant}`
  }));

  // Set default case if not provided and cases are loaded
  useEffect(() => {
    if (!caseId && cases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(cases[0].caseId);
    }
  }, [cases, caseId, selectedCaseId]);

  const acceptedFileTypes = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const validateFile = (file: File): string | null => {
    // Check file extension first (more reliable than MIME type)
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return 'Only PDF, DOC, and DOCX files are allowed';
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const updateFileProgress = (fileId: string, progress: number, status?: UploadFile['status']) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, progress, ...(status && { status }) }
        : f
    ));
  };

  const updateFileStatus = (fileId: string, status: UploadFile['status'], error?: string, url?: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status, error, url }
        : f
    ));
  };

  const handleUpload = async () => {
    if (!selectedCaseId) {
      addToast({
        type: 'error',
        title: 'Missing Case',
        message: 'Please select a case for the documents.',
        duration: 5000
      });
      return;
    }

    const validFiles = files.filter(f => f.status === 'pending');
    if (validFiles.length === 0) {
      addToast({
        type: 'error',
        title: 'No Valid Files',
        message: 'Please select valid files to upload.',
        duration: 5000
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = validFiles.map(async (fileObj) => {
        try {
          updateFileStatus(fileObj.id, 'uploading');
          
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            updateFileProgress(fileObj.id, Math.min(fileObj.progress + 10, 90));
          }, 200);

          // Upload to Supabase Storage
          const fileUrl = await uploadFileToStorage(fileObj.file);
          
          clearInterval(progressInterval);
          updateFileProgress(fileObj.id, 100, 'uploading');

          // Create document record in database
          const documentData = {
            caseId: selectedCaseId,
            type: documentType as 'Complaint' | 'Summons' | 'Affidavit' | 'Motion' | 'Order' | 'Other',
            fileURL: fileUrl,
            status: documentStatus as 'Pending' | 'Served' | 'Failed',
            originalFilename: fileObj.file.name,
            serviceDate: serviceDate || undefined,
            notes: notes || undefined
          };

          const result = await createDocument(documentData);
          
          if (result.error) {
            throw new Error(result.error.message);
          }

          updateFileStatus(fileObj.id, 'success', undefined, fileUrl);
          
          return { success: true, fileId: fileObj.id };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          updateFileStatus(fileObj.id, 'error', errorMessage);
          return { success: false, fileId: fileObj.id, error: errorMessage };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        addToast({
          type: 'success',
          title: 'Upload Complete',
          message: `${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully.`,
          duration: 5000
        });

        // Call success callback to refresh document list
        onUploadSuccess?.();
      }

      if (failCount > 0) {
        addToast({
          type: 'error',
          title: 'Upload Errors',
          message: `${failCount} document${failCount > 1 ? 's' : ''} failed to upload.`,
          duration: 7000
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'An unexpected error occurred during upload.',
        duration: 5000
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setSelectedCaseId(caseId || '');
    setDocumentType('Other');
    setDocumentStatus('Pending');
    setServiceDate('');
    setNotes('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" data-testid="success-icon" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" data-testid="error-icon" />;
      case 'uploading':
        return <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" data-testid="uploading-icon" />;
      default:
        return <FileText className="w-5 h-5 text-neutral-400" data-testid="pending-icon" />;
    }
  };

  const allFilesProcessed = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error');
  const hasSuccessfulUploads = files.some(f => f.status === 'success');

  return (
    <div className="max-w-4xl mx-auto p-content-comfortable space-y-content-comfortable">
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h1" weight="bold">Upload Documents</Typography>
          <Typography variant="body2" color="medium">Upload legal documents and associate them with cases</Typography>
        </div>
        <Button variant="outline" onClick={() => navigate('/documents')}>
          Back to Documents
        </Button>
      </div>

      <Card size="normal">
        <div className="space-y-6">
          {/* Case and Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Case"
              name="caseId"
              value={selectedCaseId}
              onChange={(value) => setSelectedCaseId(value)}
              options={[
                { 
                  value: '', 
                  label: isLoadingCases 
                    ? 'Loading cases...' 
                    : cases.length === 0 
                      ? 'No cases available'
                      : 'Select a case...' 
                },
                ...caseOptions
              ]}
              required
              disabled={isLoadingCases || cases.length === 0}
            />
            
            <Select
              label="Document Type"
              name="documentType"
              value={documentType}
              onChange={(value) => setDocumentType(value)}
              options={documentTypes}
              required
            />
          </div>
          
          {/* Additional Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              name="documentStatus"
              value={documentStatus}
              onChange={(value) => setDocumentStatus(value)}
              options={statusOptions}
            />
            
            <Input
              label="Service Date"
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Additional notes about these documents..."
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Typography variant="caption" weight="medium" color="default" className="block">
              Documents
            </Typography>
            
            <div
              className={`border-2 border-dashed rounded-lg p-content-spacious text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <div className="space-y-2">
                <Typography variant="body1" color="medium">
                  Drag and drop files here, or{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </Typography>
                <Typography variant="caption" color="muted">
                  Supports PDF, DOC, DOCX files up to 10MB each
                </Typography>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFileTypes}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Typography variant="h3" weight="medium">Selected Files</Typography>
              <div className="space-y-2">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between p-content-tight bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-content-tight flex-1">
                      {getStatusIcon(fileObj.status)}
                      <div className="flex-1 min-w-0">
                        <Typography variant="caption" weight="medium" className="truncate">
                          {fileObj.file.name}
                        </Typography>
                        <Typography variant="caption" color="muted">
                          {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        {fileObj.error && (
                          <Typography variant="caption" className="text-red-600 mt-1">
                            {typeof fileObj.error === 'string' ? fileObj.error : 'Upload error occurred'}
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {fileObj.status === 'uploading' && (
                      <div className="w-24 mx-3">
                        <div className="bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                        <Typography variant="caption" color="muted" className="mt-1 text-center">
                          {fileObj.progress}%
                        </Typography>
                      </div>
                    )}

                    {/* Remove Button */}
                    {fileObj.status !== 'uploading' && (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                        aria-label="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-content-normal border-t">
            <div className="flex space-x-content-tight">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isUploading}
              >
                Reset
              </Button>
            </div>
            
            <div className="flex space-x-content-tight">
              {allFilesProcessed && hasSuccessfulUploads && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/documents')}
                >
                  View Documents
                </Button>
              )}
              
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0 || !selectedCaseId}
                className="min-w-32"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  `Upload ${files.length > 0 ? `(${files.length})` : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DocumentUploadForm;