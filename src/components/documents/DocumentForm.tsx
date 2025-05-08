import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../../context/DataContext';
import { documentSchema } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string | null;
  defaultCaseId?: string | null;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ isOpen, onClose, docId, defaultCaseId }) => {
  const { state, dispatch } = useData();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
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

  useEffect(() => {
    if (docId) {
      const existingDocument = state.documents.find(d => d.docId === docId);
      if (existingDocument) {
        // Format the date for the input field if it exists
        const formattedDoc = {
          ...existingDocument,
          serviceDate: existingDocument.serviceDate 
            ? new Date(existingDocument.serviceDate).toISOString().split('T')[0]
            : ''
        };
        setFormData(formattedDoc);
      }
    } else {
      // Set default caseId if there are cases
      if (state.cases.length > 0) {
        setFormData({
          ...emptyDocument,
          caseId: defaultCaseId || state.cases[0].caseId,
        });
      } else {
        setFormData(emptyDocument);
      }
    }
  }, [docId, state.documents, state.cases]);

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
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        if (err.path.length > 0) {
          const field = err.path[0];
          newErrors[field] = err.message;
        }
      });
      setFormErrors(newErrors);
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    
    if (docId) {
      // Update existing document
      dispatch({
        type: 'UPDATE_DOCUMENT',
        payload: {
          ...formData,
          updatedAt: now
        }
      });
    } else {
      // Create new document
      dispatch({
        type: 'ADD_DOCUMENT',
        payload: {
          ...formData,
          docId: uuidv4(),
          createdAt: now,
          updatedAt: now
        }
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (docId && confirm('Are you sure you want to delete this document? All related service logs will also be deleted.')) {
      dispatch({ type: 'DELETE_DOCUMENT', payload: docId });
      onClose();
    }
  };

  // Prepare case options for select dropdown
  const caseOptions = state.cases.map(c => ({
    value: c.caseId,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={docId ? 'Edit Document' : 'Add New Document'}
      size="lg"
      footer={
        <>
          {docId && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex-1"></div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {docId ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
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
          disabled={caseOptions.length === 0}
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
          />
          
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
            required
            error={formErrors.status}
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
        />

        <Input
          label="Service Date"
          name="serviceDate"
          type="date"
          value={formData.serviceDate}
          onChange={handleChange}
          error={formErrors.serviceDate}
          disabled={formData.status === 'Pending'}
          hint={formData.status === 'Pending' 
            ? "Service date can only be set when status is Served or Failed" 
            : "Date when the document was served or attempted"}
        />
      </form>
    </Modal>
  );
};

export default DocumentForm;