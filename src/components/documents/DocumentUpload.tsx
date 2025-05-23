import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DocumentUploadProps {}

const DocumentUpload: React.FC<DocumentUploadProps> = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    caseId: '',
    type: 'Complaint',
    status: 'Pending',
    serviceDate: '',
    notes: ''
  });
  
  // Fetch available cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, plaintiff, defendant')
          .order('createdat', { ascending: false });
        
        if (error) throw error;
        setCases(data || []);
      } catch (err) {
        console.error('Error fetching cases:', err);
      }
    };
    
    fetchCases();
  }, []);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `documents/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      addToast({
        type: 'error',
        title: 'File Required',
        message: 'Please select a file to upload.',
        duration: 3000
      });
      return;
    }
    
    if (!formData.caseId) {
      addToast({
        type: 'error',
        title: 'Case Required',
        message: 'Please select a case for this document.',
        duration: 3000
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Upload file to Supabase storage
      const fileURL = await uploadFile(selectedFile);
      
      // Create document record
      const documentData = {
        case_id: formData.caseId,
        type: formData.type,
        file_url: fileURL,
        status: formData.status,
        service_date: formData.serviceDate || null
      };
      
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();
      
      if (error) throw error;
      
      addToast({
        type: 'success',
        title: 'Document Uploaded',
        message: 'The document has been successfully uploaded.',
        duration: 3000
      });
      
      // Navigate to the document detail page
      navigate(`/documents/${data.id}`);
      
    } catch (err) {
      console.error('Error uploading document:', err);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err instanceof Error ? err.message : 'Failed to upload document. Please try again.',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const documentTypes = [
    { value: 'Complaint', label: 'Complaint' },
    { value: 'Summons', label: 'Summons' },
    { value: 'Affidavit', label: 'Affidavit' },
    { value: 'Motion', label: 'Motion' },
    { value: 'Order', label: 'Order' },
    { value: 'Other', label: 'Other' }
  ];
  
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Served', label: 'Served' },
    { value: 'Failed', label: 'Failed' }
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/documents')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Documents
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-sm text-gray-500">
            Upload a new legal document and associate it with a case
          </p>
        </div>
      </div>
      
      {/* Upload Form */}
      <Card>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">
                        Click to select a file or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX files up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      variant="outline"
                      icon={<Upload size={16} />}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {selectedFile ? 'Change File' : 'Select File'}
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Case *
                </label>
                <Select
                  value={formData.caseId}
                  onChange={(value) => handleInputChange('caseId', value)}
                  options={[
                    { value: '', label: 'Select a case...' },
                    ...cases.map(caseItem => ({
                      value: caseItem.id,
                      label: `${caseItem.plaintiff} v. ${caseItem.defendant}`
                    }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <Select
                  value={formData.type}
                  onChange={(value) => handleInputChange('type', value)}
                  options={documentTypes}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  options={statusOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Date
                </label>
                <Input
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => handleInputChange('serviceDate', e.target.value)}
                />
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional notes about this document..."
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/documents')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !selectedFile}
                icon={<Upload size={16} />}
              >
                {isLoading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default DocumentUpload;