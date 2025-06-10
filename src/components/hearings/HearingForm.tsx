import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';
import { hearingSchema } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Card } from '../ui/shadcn-card';
import { Calendar, LinkIcon } from 'lucide-react';

interface HearingFormProps {
  isOpen: boolean;
  onClose: () => void;
  hearingId: string | null;
  defaultCaseId?: string | null;
  standalone?: boolean;
}

const HearingForm: React.FC<HearingFormProps> = ({ 
  isOpen, 
  onClose, 
  hearingId, 
  defaultCaseId,
  standalone = false 
}) => {
  const { state, dispatch } = useData();
  const navigate = useNavigate();
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
    const fetchHearing = async () => {
      if (hearingId) {
        try {
          // Try to fetch from Supabase first
          const { data, error } = await supabase
            .from('hearings')
            .select('*')
            .eq('id', hearingId)
            .single();
            
          if (error) {
            // If not found in Supabase, try local state
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
          } else if (data) {
            // Map Supabase data to form data
            const dateObj = new Date(data.hearing_date);
            const formattedDate = dateObj.toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm
            
            setFormData({
              hearingId: data.id,
              caseId: data.case_id,
              courtName: data.court_name || '',
              hearingDate: formattedDate,
              outcome: data.outcome || '',
              createdAt: data.created_at,
              updatedAt: data.updated_at
            });
          }
        } catch (error) {
          console.error('Error fetching hearing:', error);
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
    };
    
    fetchHearing();
  }, [hearingId, state.hearings, state.cases]);

  const validateForm = () => {
    try {
      hearingSchema.parse({
        ...formData,
        hearingDate: new Date(formData.hearingDate).toISOString()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    const hearingDateISO = new Date(formData.hearingDate).toISOString();
    
    let newHearingId = hearingId;
    const participants: string[] = []; // We'd populate this from the form if we had participant fields
    
    try {
      if (hearingId) {
        // Update existing hearing in Supabase
        const { error } = await supabase
          .from('hearings')
          .update({
            case_id: formData.caseId,
            hearing_date: hearingDateISO,
            participants: participants,
            outcome: formData.outcome || null,
            updated_at: now
          })
          .eq('id', hearingId);
          
        if (error) throw error;
        
        // Also update in local state
        dispatch({
          type: 'UPDATE_HEARING',
          payload: {
            ...formData,
            hearingDate: hearingDateISO,
            updatedAt: now
          }
        });
      } else {
        // Create new hearing in Supabase
        newHearingId = uuidv4();
        
        const { error } = await supabase
          .from('hearings')
          .insert({
            id: newHearingId,
            case_id: formData.caseId,
            hearing_date: hearingDateISO,
            participants: participants,
            outcome: formData.outcome || null,
            created_at: now,
            updated_at: now
          });
          
        if (error) throw error;
        
        // Also add to local state
        dispatch({
          type: 'ADD_HEARING',
          payload: {
            ...formData,
            hearingId: newHearingId,
            hearingDate: hearingDateISO,
            createdAt: now,
            updatedAt: now
          }
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving hearing:', error);
      alert('Failed to save hearing. Please try again.');
    }
  };
  
  const handleSyncToCalendar = () => {
    if (hearingId) {
      dispatch({
        type: 'SYNC_HEARING_TO_CALENDAR',
        payload: { hearingId }
      });
    }
  };

  const handleDelete = async () => {
    if (hearingId && confirm('Are you sure you want to delete this hearing?')) {
      try {
        // Delete from Supabase
        const { error } = await supabase
          .from('hearings')
          .delete()
          .eq('id', hearingId);
          
        if (error) throw error;
        
        // Also remove from local state
        dispatch({ type: 'DELETE_HEARING', payload: hearingId });
        onClose();
      } catch (error) {
        console.error('Error deleting hearing:', error);
        alert('Failed to delete hearing. Please try again.');
      }
    }
  };

  // Prepare case options for select dropdown
  const caseOptions = state.cases.map(c => ({
    value: c.caseId,
    label: `${c.plaintiff} v. ${c.defendant}`
  }));

  // Form content to be used in both modal and standalone modes
  const formContent = (
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
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Outcome
        </label>
        <textarea
          id="outcome"
          name="outcome"
          rows={3}
          className={`block w-full rounded-md shadow-sm border border-neutral-300 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 ${
            formErrors.outcome ? 'border-error-500' : ''
          }`}
          value={formData.outcome || ''}
          onChange={handleChange}
          maxLength={500}
        ></textarea>
        {formErrors.outcome && (
          <p className="mt-1 text-sm text-error-600">{formErrors.outcome}</p>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          Optional. Can be filled after the hearing is complete.
        </p>
      </div>

      {/* Form actions */}
      <div className="flex justify-end space-x-4 pt-4">
        {hearingId && (
          <>
            <Button variant="danger" type="button" onClick={handleDelete}>
              Delete
            </Button>
            <Button 
              variant="outline" 
              type="button"
              onClick={handleSyncToCalendar}
              icon={<Calendar size={16} />}
            >
              Sync to Calendar
            </Button>
          </>
        )}
        <div className="flex-1"></div>
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {hearingId ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );

  // If we're in standalone mode, render without modal
  if (standalone) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {hearingId ? 'Edit Hearing' : 'Add New Hearing'}
        </h2>
        {formContent}
      </Card>
    );
  }

  // Otherwise render in modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hearingId ? 'Edit Hearing' : 'Add New Hearing'}
      size="lg"
    >
      {formContent}
    </Modal>
  );
};

export default HearingForm;