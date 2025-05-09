import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Save, X } from 'lucide-react';

interface NotificationSettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useData();
  const [formState, setFormState] = useState({
    hearingReminders: true,
    deadlineReminders: true,
    documentUpdates: true,
    workflowUpdates: true,
    systemAnnouncements: true,
    emailNotifications: false,
    advanceHearingReminder: 24,
    advanceDeadlineReminder: 48
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormState({
      ...formState,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update notification settings in global state
    dispatch({
      type: 'UPDATE_NOTIFICATION_SETTINGS',
      payload: formState
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
      
      <Card className="relative z-10 max-w-2xl w-full">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
            <button 
              type="button" 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="hearingReminders"
                    name="hearingReminders"
                    type="checkbox"
                    checked={formState.hearingReminders}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="hearingReminders" className="ml-2 text-sm text-gray-700">
                    Hearing reminders
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="deadlineReminders"
                    name="deadlineReminders"
                    type="checkbox"
                    checked={formState.deadlineReminders}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="deadlineReminders" className="ml-2 text-sm text-gray-700">
                    Deadline reminders
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="documentUpdates"
                    name="documentUpdates"
                    type="checkbox"
                    checked={formState.documentUpdates}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="documentUpdates" className="ml-2 text-sm text-gray-700">
                    Document updates
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="workflowUpdates"
                    name="workflowUpdates"
                    type="checkbox"
                    checked={formState.workflowUpdates}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="workflowUpdates" className="ml-2 text-sm text-gray-700">
                    Workflow updates
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="systemAnnouncements"
                    name="systemAnnouncements"
                    type="checkbox"
                    checked={formState.systemAnnouncements}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="systemAnnouncements" className="ml-2 text-sm text-gray-700">
                    System announcements
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={formState.emailNotifications}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                    Email notifications
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Reminder Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="advanceHearingReminder" className="block text-sm font-medium text-gray-700 mb-1">
                    Hearing reminder (hours before)
                  </label>
                  <div className="flex items-center">
                    <input
                      id="advanceHearingReminder"
                      name="advanceHearingReminder"
                      type="number"
                      min="1"
                      max="168"
                      value={formState.advanceHearingReminder}
                      onChange={handleChange}
                      className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <span className="ml-2 text-sm text-gray-500">hours</span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="advanceDeadlineReminder" className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline reminder (hours before)
                  </label>
                  <div className="flex items-center">
                    <input
                      id="advanceDeadlineReminder"
                      name="advanceDeadlineReminder"
                      type="number"
                      min="1"
                      max="168"
                      value={formState.advanceDeadlineReminder}
                      onChange={handleChange}
                      className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <span className="ml-2 text-sm text-gray-500">hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Save size={16} />}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NotificationSettingsForm;