import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../../context/DataContext';
import { caseSchema } from '../../types/schema';
import { supabase } from '../../lib/supabaseClient';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    
    try {
      if (caseId) {
        // Update existing case in Supabase
        const { error } = await supabase
          .from('cases')
          .update({
            plaintiff: formData.plaintiff,
            defendant: formData.defendant,
            address: formData.address,
            status: formData.status,
            dateFiled: formData.dateFiled || null,
            updated_at: now
          })
          .eq('id', caseId);
          
        if (error) throw error;
        
        // Also update in local state
        dispatch({
          type: 'UPDATE_CASE',
          payload: {
            ...formData,
            updatedAt: now
          }
        });
      } else {
        // Create new case in Supabase
        const newCaseId = uuidv4();
        
        const { error } = await supabase
          .from('cases')
          .insert({
            id: newCaseId,
            plaintiff: formData.plaintiff,
            defendant: formData.defendant,
            address: formData.address,
            status: formData.status,
            dateFiled: formData.dateFiled || null,
            created_at: now,
            updated_at: now
          });
          
        if (error) throw error;
        
        // Also add to local state
        dispatch({
          type: 'ADD_CASE',
          payload: {
            ...formData,
            caseId: newCaseId,
            createdAt: now,
            updatedAt: now
          }
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Failed to save case. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (caseId && confirm('Are you sure you want to delete this case? All related records will also be deleted.')) {
      try {
        // Delete from Supabase
        const { error } = await supabase
          .from('cases')
          .delete()
          .eq('id', caseId);
          
        if (error) throw error;
        
        // Also remove from local state
        dispatch({ type: 'DELETE_CASE', payload: caseId });
        onClose();
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Failed to delete case. Please try again.');
      }
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