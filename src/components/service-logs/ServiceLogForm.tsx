import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../../context/DataContext';
import { serviceLogSchema } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface ServiceLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  logId: string | null;
}

const ServiceLogForm: React.FC<ServiceLogFormProps> = ({ isOpen, onClose, logId }) => {
  const { state, dispatch } = useData();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const emptyLog = {
    logId: '',
    docId: '',
    method: 'Sheriff',
    attemptDate: new Date().toISOString().slice(0, 16), // format: YYYY-MM-DDThh:mm
    result: 'Success',
    createdAt: '',
    updatedAt: '',
  };
  
  const [formData, setFormData] = useState(emptyLog);

  useEffect(() => {
    if (logId) {
      const existingLog = state.serviceLogs.find(l => l.logId === logId);
      if (existingLog) {
        // Format the date for the input field
        const dateObj = new Date(existingLog.attemptDate);
        const formattedDate = dateObj.toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm
        
        setFormData({
          ...existingLog,
          attemptDate: formattedDate
        });
      }
    } else {
      // Set default docId if there are documents
      if (state.documents.length > 0) {
        setFormData({
          ...emptyLog,
          docId: state.documents[0].docId,
        });
      } else {
        setFormData(emptyLog);
      }
    }
  }, [logId, state.serviceLogs, state.documents]);

  const validateForm = () => {
    try {
      serviceLogSchema.parse({
        ...formData,
        attemptDate: new Date(formData.attemptDate).toISOString()
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    const attemptDateISO = new Date(formData.attemptDate).toISOString();
    
    if (logId) {
      // Update existing log
      dispatch({
        type: 'UPDATE_SERVICE_LOG',
        payload: {
          ...formData,
          attemptDate: attemptDateISO,
          updatedAt: now
        }
      });
    } else {
      // Create new log
      dispatch({
        type: 'ADD_SERVICE_LOG',
        payload: {
          ...formData,
          logId: uuidv4(),
          attemptDate: attemptDateISO,
          createdAt: now,
          updatedAt: now
        }
      });

      // If service was successful, update the document status
      if (formData.result === 'Success') {
        const document = state.documents.find(d => d.docId === formData.docId);
        if (document) {
          dispatch({
            type: 'UPDATE_DOCUMENT',
            payload: {
              ...document,
              status: 'Served',
              serviceDate: attemptDateISO.split('T')[0],
              updatedAt: now
            }
          });
        }
      }
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (logId && confirm('Are you sure you want to delete this service log?')) {
      dispatch({ type: 'DELETE_SERVICE_LOG', payload: logId });
      onClose();
    }
  };

  // Prepare document options
  const documentOptions = state.documents.map(d => {
    const associatedCase = state.cases.find(c => c.caseId === d.caseId);
    const caseInfo = associatedCase ? `(${associatedCase.plaintiff} v. ${associatedCase.defendant})` : '';
    return {
      value: d.docId,
      label: `${d.type} ${caseInfo}`
    };
  });

  // Method options
  const methodOptions = [
    { value: 'Sheriff', label: 'Sheriff' },
    { value: 'SPS', label: 'SPS' },
  ];

  // Result options
  const resultOptions = [
    { value: 'Success', label: 'Success' },
    { value: 'Failed', label: 'Failed' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={logId ? 'Edit Service Log' : 'Add New Service Log'}
      size="lg"
      footer={
        <>
          {logId && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex-1"></div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {logId ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Document"
          name="docId"
          value={formData.docId}
          onChange={handleChange}
          options={documentOptions}
          required
          error={formErrors.docId}
          hint={documentOptions.length === 0 ? "You need to create a document first" : undefined}
          disabled={documentOptions.length === 0 || !!logId}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Service Method"
            name="method"
            value={formData.method}
            onChange={handleChange}
            options={methodOptions}
            required
            error={formErrors.method}
          />
          
          <Select
            label="Result"
            name="result"
            value={formData.result}
            onChange={handleChange}
            options={resultOptions}
            required
            error={formErrors.result}
          />
        </div>

        <Input
          label="Attempt Date and Time"
          name="attemptDate"
          type="datetime-local"
          value={formData.attemptDate}
          onChange={handleChange}
          required
          error={formErrors.attemptDate}
        />
      </form>
    </Modal>
  );
};

export default ServiceLogForm;