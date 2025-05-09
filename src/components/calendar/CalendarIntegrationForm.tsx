import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CalendarIntegration } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface CalendarIntegrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  integrationId?: string;
}

const CalendarIntegrationForm: React.FC<CalendarIntegrationFormProps> = ({
  isOpen,
  onClose,
  integrationId
}) => {
  const { state, dispatch } = useData();
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    userId: 'current-user', // Default userId for demo purposes
    providerType: 'Google' as CalendarIntegration['providerType'],
    providerName: '',
    authToken: '',
    refreshToken: '',
    calendarId: '',
    isActive: true,
  });

  // Load integration data if editing
  useEffect(() => {
    if (integrationId) {
      const integration = state.calendarIntegrations.find(i => i.integrationId === integrationId);
      if (integration) {
        setForm({
          userId: integration.userId,
          providerType: integration.providerType,
          providerName: integration.providerName,
          authToken: integration.authToken || '',
          refreshToken: integration.refreshToken || '',
          calendarId: integration.calendarId || '',
          isActive: integration.isActive,
        });
      }
    }
  }, [integrationId, state.calendarIntegrations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!form.providerName) {
      setError('Provider name is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    
    if (integrationId) {
      // Update existing integration
      const integration = state.calendarIntegrations.find(i => i.integrationId === integrationId);
      if (!integration) return;
      
      const updatedIntegration: CalendarIntegration = {
        ...integration,
        providerType: form.providerType,
        providerName: form.providerName,
        authToken: form.authToken || undefined,
        refreshToken: form.refreshToken || undefined,
        calendarId: form.calendarId || undefined,
        isActive: form.isActive,
        updatedAt: now,
      };
      
      dispatch({ type: 'UPDATE_CALENDAR_INTEGRATION', payload: updatedIntegration });
    } else {
      // Create new integration
      const newIntegration: CalendarIntegration = {
        integrationId: uuidv4(),
        userId: form.userId,
        providerType: form.providerType,
        providerName: form.providerName,
        authToken: form.authToken || undefined,
        refreshToken: form.refreshToken || undefined,
        calendarId: form.calendarId || undefined,
        isActive: form.isActive,
        createdAt: now,
        updatedAt: now,
      };
      
      dispatch({ type: 'ADD_CALENDAR_INTEGRATION', payload: newIntegration });
    }
    
    onClose();
  };

  // Provider type options
  const providerTypeOptions = [
    { value: 'Google', label: 'Google Calendar' },
    { value: 'Outlook', label: 'Microsoft Outlook' },
    { value: 'iCloud', label: 'Apple iCloud' },
    { value: 'Other', label: 'Other' },
  ];

  // In a real app, this would be handled by OAuth flow
  const simulateOAuthFlow = () => {
    // Simulate obtaining tokens from OAuth flow
    setForm(prev => ({
      ...prev,
      authToken: `auth_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
      calendarId: form.providerType === 'Google' 
        ? 'primary' 
        : form.providerType === 'Outlook'
          ? 'default'
          : 'main',
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={integrationId ? 'Edit Calendar Integration' : 'Add Calendar Integration'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider Type
          </label>
          <Select
            name="providerType"
            value={form.providerType}
            onChange={handleInputChange}
            options={providerTypeOptions}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Calendar Name*
          </label>
          <Input
            name="providerName"
            value={form.providerName}
            onChange={handleInputChange}
            placeholder={`My ${form.providerType} Calendar`}
          />
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Authentication</h3>
          <p className="text-xs text-gray-500 mb-3">
            In a production system, this would be handled by OAuth flow with the calendar provider.
            For demo purposes, we're simulating the auth flow.
          </p>
          
          <Button
            onClick={simulateOAuthFlow}
            variant="outline"
            size="sm"
          >
            Connect to {form.providerType}
          </Button>
          
          {form.authToken && (
            <div className="mt-3 text-xs text-green-600 flex items-center">
              <CheckCircle size={14} className="mr-1" />
              Connected successfully
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={form.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active (sync events with this calendar)
          </label>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm flex items-center">
            <AlertCircle size={16} className="mr-1" />
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4 mt-2 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.providerName}
          >
            {integrationId ? 'Update Integration' : 'Add Integration'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalendarIntegrationForm;