import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../../context/DataContext';
import { documentSchema } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { supabase } from '../../lib/supabaseClient';
import { createDocument, updateDocument, deleteDocument } from '../../hooks/useDocuments';
import { AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string | null;
  defaultCaseId?: string | null;
  onSuccess?: () => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ 
  isOpen, 
  onClose, 
  docId, 
  defaultCaseId,
  onSuccess 
}) => {
  const { state } = useData();
  const { addToast } = useToast();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cases, setCases] = useState<Array<{id: string; plaintiff: string; defendant: string}>>([]);
  
  const emptyDocument = {
    docId: '',
    caseId: '',
    type: 'Complaint',
    fileURL: '',
    status: 'Pending',
    serviceDate: '',
    createdAt: '',
    updatedAt: '',
  };
  
  const [formData, setFormData] = useState(emptyDocument);

  // Fetch cases from Supabase
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, plaintiff, defendant')
          .order('createdat', { ascending: false });
          
        if (error) throw error;
        setCases(data || []);
        
        // Set default case if we have cases and no defaultCaseId
        if (data && data.length > 0 && !docId && !defaultCaseId) {
          setFormData(prev => ({
            ...prev,
            caseId: data[0].id
          }));
        }
        
        // Set default caseId if provided
        if (!docId && defaultCaseId) {
          setFormData(prev => ({
            ...prev,
            caseId: defaultCaseId
          }));
        }
        
      } catch (err) {
        console.error('Error fetching cases:', err);
      }
    };
    
    fetchCases();
  }, []);

  // Fetch document data if editing
  useEffect(() => {
    const fetchDocument = async () => {
      if (!docId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Format the data for our form
          setFormData({
            docId: data.id,
            caseId: data.case_id,
            type: data.type,
            fileURL: data.fileURL,
            status: data.status,
            serviceDate: data.service_date 
              ? new Date(data.service_date).toISOString().split('T')[0]
              : '',
            createdAt: data.created_at,
            updatedAt: data.updated_at
          });
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocument();
  }, [docId]);

  const validateForm = () => {
    try {
      // Create a validation copy with the proper date format for serviceDate
      const validationCopy = {
        ...formData,
        serviceDate: formData.serviceDate ? formData.serviceDate : undefined
      };
      
      documentSchema.parse(validationCopy);
      setFormErrors({});
      return true;
    } catch (error: unknown) {
      const newErrors: Record<string, string> = {};
      if (error && typeof error === 'object' && 'errors' in error) {
        (error as { errors: { path: string[]; message: string }[] }).errors.forEach((err) => {
          if (err.path.length > 0) {
            const field = err.path[0];
            newErrors[field] = err.message;
          }
        });
      }
      setFormErrors(newErrors);
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (docId) {
        // Update existing document
        const { success, error } = await updateDocument({
          ...formData,
          docId,
        });
        
        if (error) throw error;
        
        // Show success toast
        addToast({
          type: 'success',
          title: 'Document Updated',
          message: 'Document has been successfully updated',
          duration: 3000
        });
        
        if (success && onSuccess) {
          onSuccess();
        }
      } else {
        // Create new document
        const newId = uuidv4();
        
        const { id, error } = await createDocument({
          ...formData,
          docId: newId,
        });
        
        if (error) throw error;
        
        // Show success toast
        addToast({
          type: 'success',
          title: 'Document Created',
          message: 'New document has been successfully created',
          duration: 3000
        });
        
        if (id && onSuccess) {
          onSuccess();
        }
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving document:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Show error toast
      addToast({
        type: 'error',
        title: 'Error Saving Document',
        message: err instanceof Error ? err.message : String(err),
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!docId) return;
    
    if (confirm('Are you sure you want to delete this document? All related service logs will also be deleted.')) {
      setIsLoading(true);
      setError(null);
      
      try {
        const { success, error } = await deleteDocument(docId);
        
        if (error) throw error;
        
        // Show success toast
        addToast({
          type: 'success',
          title: 'Document Deleted',
          message: 'Document has been successfully removed',
          duration: 3000
        });
        
        if (success && onSuccess) {
          onSuccess();
        }
        
        onClose();
      } catch (err) {
        console.error('Error deleting document:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Show error toast
        addToast({
          type: 'error',
          title: 'Error Deleting Document',
          message: err instanceof Error ? err.message : String(err),
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Prepare case options for select dropdown
  const caseOptions = cases.map(c => ({
    value: c.id,
    label: `${c.plaintiff} v. ${c.defendant}`
  }));

  // Document type options
  const typeOptions = [
    { value: 'Complaint', label: 'Complaint' },
    { value: 'Summons', label: 'Summons' },
    { value: 'Affidavit', label: 'Affidavit' },
    { value: 'Motion', label: 'Motion' },
    { value: 'Order', label: 'Order' },
    { value: 'Other', label: 'Other' },
  ];

  // Document status options
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Served', label: 'Served' },
    { value: 'Failed', label: 'Failed' },
  ];

  // Error message component
  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <AlertCircle size={20} className="text-red-500 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-1">
            {error?.message || 'An error occurred. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={docId ? 'Edit Document' : 'Add New Document'}
      size="lg"
      footer={
        <>
          {docId && (
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          )}
          <div className="flex-1"></div>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : docId ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      {error && <ErrorMessage />}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Case"
          name="caseId"
          value={formData.caseId}
          onChange={handleChange}
          options={caseOptions}
          required
          error={formErrors.caseId}
          hint={caseOptions.length === 0 ? "You need to create a case first" : undefined}
          disabled={caseOptions.length === 0 || isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Document Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={typeOptions}
            required
            error={formErrors.type}
            disabled={isLoading}
          />
          
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
            required
            error={formErrors.status}
            disabled={isLoading}
          />
        </div>

        <Input
          label="File URL"
          name="fileURL"
          type="url"
          value={formData.fileURL}
          onChange={handleChange}
          required
          error={formErrors.fileURL}
          placeholder="https://example.com/document.pdf"
          hint="Link to document file (PDF, DOC, DOCX)"
          disabled={isLoading}
        />

        <Input
          label="Service Date"
          name="serviceDate"
          type="date"
          value={formData.serviceDate}
          onChange={handleChange}
          error={formErrors.serviceDate}
          disabled={formData.status === 'Pending' || isLoading}
          hint={formData.status === 'Pending' 
            ? "Service date can only be set when status is Served or Failed" 
            : "Date when the document was served or attempted"}
        />
      </form>
    </Modal>
  );
};

export default DocumentForm;