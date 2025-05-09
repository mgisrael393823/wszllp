import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { AlertCircle } from 'lucide-react';
import { Workflow } from '../../types/schema';

interface WorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string | null;
  isTemplate?: boolean;
}

const WorkflowForm: React.FC<WorkflowFormProps> = ({ 
  isOpen, 
  onClose, 
  workflowId,
  isTemplate = false
}) => {
  const { state, dispatch } = useData();
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    caseId: '',
    isTemplate: isTemplate,
    triggerType: 'Manual' as const,
  });

  // Find existing workflow if editing
  useEffect(() => {
    if (workflowId) {
      const existingWorkflow = state.workflows.find(w => w.workflowId === workflowId);
      if (existingWorkflow) {
        setForm({
          name: existingWorkflow.name,
          description: existingWorkflow.description || '',
          caseId: existingWorkflow.caseId,
          isTemplate: existingWorkflow.isTemplate,
          triggerType: existingWorkflow.triggerType || 'Manual',
        });
      }
    }
  }, [workflowId, state.workflows]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Form validation
    if (!form.name) {
      setFormError('Workflow name is required');
      return;
    }

    if (!form.isTemplate && !form.caseId) {
      setFormError('Please select a case for this workflow');
      return;
    }

    const now = new Date().toISOString();
    
    if (workflowId) {
      // Update existing workflow
      const updatedWorkflow: Workflow = {
        ...state.workflows.find(w => w.workflowId === workflowId)!,
        name: form.name,
        description: form.description,
        caseId: form.isTemplate ? (form.caseId || '') : form.caseId,
        isTemplate: form.isTemplate,
        triggerType: form.triggerType as Workflow['triggerType'],
        updatedAt: now,
      };
      
      dispatch({ type: 'UPDATE_WORKFLOW', payload: updatedWorkflow });
    } else {
      // Create new workflow
      const newWorkflow: Workflow = {
        workflowId: uuidv4(),
        name: form.name,
        description: form.description,
        caseId: form.isTemplate ? '' : form.caseId,
        isTemplate: form.isTemplate,
        isActive: true,
        triggerType: form.triggerType as Workflow['triggerType'],
        createdAt: now,
        updatedAt: now,
      };
      
      dispatch({ type: 'ADD_WORKFLOW', payload: newWorkflow });
    }
    
    onClose();
  };

  // Get case options for dropdown
  const caseOptions = state.cases.map(c => ({
    value: c.caseId,
    label: `${c.plaintiff} v. ${c.defendant}`
  }));

  // Trigger type options
  const triggerTypeOptions = [
    { value: 'Manual', label: 'Manual' },
    { value: 'OnCaseCreation', label: 'On Case Creation' },
    { value: 'OnStatusChange', label: 'On Status Change' },
    { value: 'OnDocumentFiled', label: 'On Document Filed' },
    { value: 'OnHearingScheduled', label: 'On Hearing Scheduled' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={workflowId ? 'Edit Workflow' : (isTemplate ? 'Create Workflow Template' : 'Create New Workflow')}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workflow Name*
          </label>
          <Input
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder="Enter workflow name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            placeholder="Describe this workflow"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            rows={3}
          />
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isTemplate"
              name="isTemplate"
              checked={form.isTemplate}
              onChange={(e) => setForm(prev => ({ ...prev, isTemplate: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isTemplate" className="ml-2 text-sm text-gray-700">
              This is a template
            </label>
          </div>
        </div>
        
        {!form.isTemplate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case*
            </label>
            <Select
              name="caseId"
              value={form.caseId}
              onChange={handleInputChange}
              options={caseOptions}
              placeholder="Select a case"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Type
          </label>
          <Select
            name="triggerType"
            value={form.triggerType}
            onChange={handleInputChange}
            options={triggerTypeOptions}
          />
        </div>

        {formError && (
          <div className="text-red-500 text-sm flex items-center">
            <AlertCircle size={16} className="mr-1" />
            {formError}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-5 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
          >
            {workflowId ? 'Update Workflow' : 'Create Workflow'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkflowForm;