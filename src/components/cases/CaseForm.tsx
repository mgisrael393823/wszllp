import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../../context/DataContext';
import { caseSchema } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface CaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string | null;
}

const CaseForm: React.FC<CaseFormProps> = ({ isOpen, onClose, caseId }) => {
  const { state, dispatch } = useData();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const emptyCase = {
    caseId: '',
    plaintiff: '',
    defendant: '',
    address: '',
    status: 'SPS NOT SERVED',
    dateFiled: '',
    createdAt: '',
    updatedAt: '',
  };
  
  const [formData, setFormData] = useState(emptyCase);

  useEffect(() => {
    if (caseId) {
      const existingCase = state.cases.find(c => c.caseId === caseId);
      if (existingCase) {
        // Format the date for the input field
        const formattedCase = {
          ...existingCase
        };
        setFormData(formattedCase);
      }
    } else {
      setFormData(emptyCase);
    }
  }, [caseId, state.cases]);

  const validateForm = () => {
    try {
      caseSchema.parse(formData);
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
    
    if (caseId) {
      // Update existing case
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          ...formData,
          updatedAt: now
        }
      });
    } else {
      // Create new case
      dispatch({
        type: 'ADD_CASE',
        payload: {
          ...formData,
          caseId: uuidv4(),
          createdAt: now,
          updatedAt: now
        }
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (caseId && confirm('Are you sure you want to delete this case? All related records will also be deleted.')) {
      dispatch({ type: 'DELETE_CASE', payload: caseId });
      onClose();
    }
  };

  const statusOptions = [
    { value: 'SPS NOT SERVED', label: 'SPS NOT SERVED' },
    { value: 'SPS PENDING', label: 'SPS PENDING' },
    { value: 'SEND TO SPS', label: 'SEND TO SPS' },
    { value: 'SPS SERVED', label: 'SPS SERVED' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={caseId ? 'Edit Case' : 'Add New Case'}
      size="lg"
      footer={
        <>
          {caseId && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex-1"></div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {caseId ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Plaintiff"
            name="plaintiff"
            value={formData.plaintiff}
            onChange={handleChange}
            maxLength={100}
            required
            error={formErrors.plaintiff}
          />
          
          <Input
            label="Defendant"
            name="defendant"
            value={formData.defendant}
            onChange={handleChange}
            maxLength={100}
            required
            error={formErrors.defendant}
          />
        </div>

        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          maxLength={200}
          required
          error={formErrors.address}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Case Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
            required
            error={formErrors.status}
          />
          
          <Input
            label="Date Filed"
            name="dateFiled"
            type="date"
            value={formData.dateFiled}
            onChange={handleChange}
            error={formErrors.dateFiled}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CaseForm;