import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, addHours, parseISO } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CalendarEvent } from '../../types/schema';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface CalendarEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  initialDate?: Date;
}

const CalendarEventForm: React.FC<CalendarEventFormProps> = ({
  isOpen,
  onClose,
  eventId,
  initialDate
}) => {
  const { state, dispatch } = useData();
  const [error, setError] = useState<string | null>(null);
  
  // Default start/end time (1 hour from now, or from the initialDate)
  const getDefaultStartTime = () => {
    const date = initialDate || new Date();
    date.setMinutes(0, 0, 0); // Round to the nearest hour
    return date;
  };
  
  const getDefaultEndTime = () => {
    return addHours(getDefaultStartTime(), 1);
  };
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: format(getDefaultStartTime(), 'yyyy-MM-dd'),
    startTime: format(getDefaultStartTime(), 'HH:mm'),
    endDate: format(getDefaultEndTime(), 'yyyy-MM-dd'),
    endTime: format(getDefaultEndTime(), 'HH:mm'),
    eventType: 'Other' as CalendarEvent['eventType'],
    isAllDay: false,
    caseId: '',
    hearingId: '',
  });

  // Load event data if editing
  useEffect(() => {
    if (eventId) {
      const event = state.calendarEvents.find(e => e.eventId === eventId);
      if (event) {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        setForm({
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          startDate: format(startDate, 'yyyy-MM-dd'),
          startTime: format(startDate, 'HH:mm'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          endTime: format(endDate, 'HH:mm'),
          eventType: event.eventType,
          isAllDay: event.isAllDay,
          caseId: event.caseId || '',
          hearingId: event.hearingId || '',
        });
      }
    } else if (initialDate) {
      const startDate = new Date(initialDate);
      const endDate = addHours(startDate, 1);
      
      setForm(prev => ({
        ...prev,
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: format(endDate, 'HH:mm'),
      }));
    }
  }, [eventId, state.calendarEvents, initialDate]);

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
    if (!form.title) {
      setError('Title is required');
      return false;
    }
    
    // Create Date objects for validation
    const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const now = new Date().toISOString();
    const startDateTime = new Date(`${form.startDate}T${form.startTime}`).toISOString();
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`).toISOString();
    
    if (eventId) {
      // Update existing event
      const event = state.calendarEvents.find(e => e.eventId === eventId);
      if (!event) return;
      
      const updatedEvent: CalendarEvent = {
        ...event,
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        eventType: form.eventType,
        isAllDay: form.isAllDay,
        caseId: form.caseId || undefined,
        hearingId: form.hearingId || undefined,
        syncStatus: 'Manual', // Reset sync status when manually edited
        updatedAt: now,
      };
      
      dispatch({ type: 'UPDATE_CALENDAR_EVENT', payload: updatedEvent });
    } else {
      // Create new event
      const newEvent: CalendarEvent = {
        eventId: uuidv4(),
        title: form.title,
        description: form.description || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        location: form.location || undefined,
        eventType: form.eventType,
        isAllDay: form.isAllDay,
        caseId: form.caseId || undefined,
        hearingId: form.hearingId || undefined,
        syncStatus: 'Manual',
        createdAt: now,
        updatedAt: now,
      };
      
      dispatch({ type: 'ADD_CALENDAR_EVENT', payload: newEvent });
    }
    
    onClose();
  };

  // Get list of cases for dropdown
  const caseOptions = [
    { value: '', label: '-- None --' },
    ...state.cases.map(c => ({
      value: c.caseId,
      label: `${c.plaintiff} v. ${c.defendant}`
    }))
  ];

  // Get list of hearings for the selected case
  const hearingOptions = form.caseId 
    ? [
        { value: '', label: '-- None --' },
        ...state.hearings
          .filter(h => h.caseId === form.caseId)
          .map(h => ({
            value: h.hearingId,
            label: `${h.courtName} - ${format(parseISO(h.hearingDate), 'MMM d, yyyy h:mm a')}`
          }))
      ]
    : [{ value: '', label: '-- Select a case first --' }];

  // Event type options
  const eventTypeOptions = [
    { value: 'Hearing', label: 'Hearing' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Deadline', label: 'Deadline' },
    { value: 'Reminder', label: 'Reminder' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventId ? 'Edit Event' : 'Create Event'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title*
          </label>
          <Input
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder="Event title"
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
            placeholder="Event description"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            name="location"
            value={form.location}
            onChange={handleInputChange}
            placeholder="Event location"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAllDay"
            name="isAllDay"
            checked={form.isAllDay}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-900">
            All day event
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date*
            </label>
            <Input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleInputChange}
            />
          </div>
          
          {!form.isAllDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time*
              </label>
              <Input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleInputChange}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date*
            </label>
            <Input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleInputChange}
            />
          </div>
          
          {!form.isAllDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time*
              </label>
              <Input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleInputChange}
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <Select
            name="eventType"
            value={form.eventType}
            onChange={handleInputChange}
            options={eventTypeOptions}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Related Case
          </label>
          <Select
            name="caseId"
            value={form.caseId}
            onChange={handleInputChange}
            options={caseOptions}
          />
        </div>
        
        {form.caseId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Hearing
            </label>
            <Select
              name="hearingId"
              value={form.hearingId}
              onChange={handleInputChange}
              options={hearingOptions}
              disabled={!form.caseId}
            />
          </div>
        )}
        
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
          >
            {eventId ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalendarEventForm;