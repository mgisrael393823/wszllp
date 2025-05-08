import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../../context/DataContext';
import { hearingSchema } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface HearingFormProps {
  isOpen: boolean;
  onClose: () => void;
  hearingId: string | null;
  defaultCaseId?: string | null;
}

const HearingForm: React.FC<HearingFormProps> = ({ isOpen, onClose, hearingId, defaultCaseId }) => {
  const { state, dispatch } = useData();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const emptyHearing = {
    hearingId: '',
    caseId: '',
    courtName: '',
    hearingDate: new Date().toISOString().slice(0, 16), // format: YYYY-MM-DDThh:mm
    outcome: '',
    createdAt: '',
    updatedAt: '',
  };
  
  const [formData, setFormData] = useState(emptyHearing);

  useEffect(() => {
    if (hearingId) {
      const existingHearing = state.hearings.find(h => h.hearingId === hearingId);
      if (existingHearing) {
        // Format the date for the input field
        const dateObj = new Date(existingHearing.hearingDate);
        const formattedDate = dateObj.toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm
        
        setFormData({
          ...existingHearing,
          hearingDate: formattedDate
        });
      }
    } else {
      // Set default caseId if there are cases
      if (state.cases.length > 0) {
        setFormData({
          ...emptyHearing,
          caseId: defaultCaseId || state.cases[0].caseId,
        });
      } else {
        setFormData(emptyHearing);
      }
    }
  }, [hearingId, state.hearings, state.cases]);

  const validateForm = () => {
    try {
      hearingSchema.parse({
        ...formData,
        hearingDate: new Date(formData.hearingDate).toISOString()
      });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    const hearingDateISO = new Date(formData.hearingDate).toISOString();
    
    if (hearingId) {
      // Update existing hearing
      dispatch({
        type: 'UPDATE_HEARING',
        payload: {
          ...formData,
          hearingDate: hearingDateISO,
          updatedAt: now
        }
      });
    } else {
      // Create new hearing
      dispatch({
        type: 'ADD_HEARING',
        payload: {
          ...formData,
          hearingId: uuidv4(),
          hearingDate: hearingDateISO,
          createdAt: now,
          updatedAt: now
        }
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (hearingId && confirm('Are you sure you want to delete this hearing?')) {
      dispatch({ type: 'DELETE_HEARING', payload: hearingId });
      onClose();
    }
  };

  // Prepare case options for select dropdown
  const caseOptions = state.cases.map(c => ({
    value: c.caseId,
    label: `${c.plaintiff} v. ${c.defendant}`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hearingId ? 'Edit Hearing' : 'Add New Hearing'}
      size="lg"
      footer={
        <>
          {hearingId && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex-1"></div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {hearingId ? 'Update' : 'Create'}
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

        <Input
          label="Court Name"
          name="courtName"
          value={formData.courtName}
          onChange={handleChange}
          maxLength={100}
          required
          error={formErrors.courtName}
        />

        <Input
          label="Hearing Date and Time"
          name="hearingDate"
          type="datetime-local"
          value={formData.hearingDate}
          onChange={handleChange}
          required
          error={formErrors.hearingDate}
        />

        <div className="w-full">
          <label
            htmlFor="outcome"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Outcome
          </label>
          <textarea
            id="outcome"
            name="outcome"
            rows={3}
            className={`block w-full rounded-md shadow-sm border border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 ${
              formErrors.outcome ? 'border-error-500' : ''
            }`}
            value={formData.outcome || ''}
            onChange={handleChange}
            maxLength={500}
          ></textarea>
          {formErrors.outcome && (
            <p className="mt-1 text-sm text-error-600">{formErrors.outcome}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional. Can be filled after the hearing is complete.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default HearingForm;