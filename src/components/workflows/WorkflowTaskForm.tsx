import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useData } from '../../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { workflowTaskTypeEnum, WorkflowTask } from '../../types/schema';

interface WorkflowTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  taskId: string | null;
  existingTasks: WorkflowTask[];
}

interface TaskFormData {
  name: string;
  description: string;
  type: string;
  dueDate: string;
  dependsOn: string[];
  order: number;
}

const WorkflowTaskForm: React.FC<WorkflowTaskFormProps> = ({
  isOpen,
  onClose,
  workflowId,
  taskId,
  existingTasks,
}) => {
  const { state, dispatch } = useData();
  const isEditMode = !!taskId;
  
  // Get the task if in edit mode
  const existingTask = taskId 
    ? existingTasks.find(t => t.taskId === taskId) 
    : null;
  
  // Set up form with default values
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<TaskFormData>({
    defaultValues: {
      name: '',
      description: '',
      type: 'FileDocument',
      dueDate: '',
      dependsOn: [],
      order: existingTasks.length + 1,
    }
  });
  
  // Watch the type field to update UI
  const watchedType = watch('type');
  
  // Set form values when editing an existing task
  useEffect(() => {
    if (isEditMode && existingTask) {
      reset({
        name: existingTask.name,
        description: existingTask.description || '',
        type: existingTask.type,
        dueDate: existingTask.dueDate ? new Date(existingTask.dueDate).toISOString().substring(0, 10) : '',
        dependsOn: existingTask.dependsOn || [],
        order: existingTask.order,
      });
    }
  }, [isEditMode, existingTask, reset]);
  
  // Task type options
  const taskTypeOptions = Object.values(workflowTaskTypeEnum.Values).map(type => ({
    value: type,
    label: type.replace(/([A-Z])/g, ' $1').trim() // Convert camelCase to words
  }));
  
  // Only allow dependencies on tasks that come before this one
  const dependencyOptions = existingTasks
    .filter(task => !isEditMode || task.taskId !== taskId) // Can't depend on self
    .filter(task => !isEditMode || task.order < existingTask!.order) // Can only depend on earlier tasks when editing
    .map(task => ({
      value: task.taskId,
      label: task.name
    }));
  
  // Handle form submission
  const onSubmit = (data: TaskFormData) => {
    if (isEditMode && existingTask) {
      // Update existing task
      dispatch({
        type: 'UPDATE_WORKFLOW_TASK',
        payload: {
          ...existingTask,
          ...data,
          updatedAt: new Date().toISOString(),
        }
      });
    } else {
      // Create new task
      const newTask: WorkflowTask = {
        taskId: uuidv4(),
        workflowId,
        type: data.type as any,
        name: data.name,
        description: data.description,
        dueDate: data.dueDate || undefined,
        isComplete: false,
        completedAt: undefined,
        order: data.order,
        dependsOn: data.dependsOn.length > 0 ? data.dependsOn : undefined,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      dispatch({
        type: 'ADD_WORKFLOW_TASK',
        payload: newTask
      });
    }
    
    onClose();
  };
  
  // Format task type name for display
  const formatTaskType = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').trim();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Task' : 'Add Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Task Name */}
        <div>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Task name is required' }}
            render={({ field }) => (
              <Input
                {...field}
                label="Task Name"
                placeholder="Enter task name"
                error={errors.name?.message}
              />
            )}
          />
        </div>
        
        {/* Task Type */}
        <div>
          <Controller
            name="type"
            control={control}
            rules={{ required: 'Task type is required' }}
            render={({ field }) => (
              <Select
                {...field}
                label="Task Type"
                options={taskTypeOptions}
                error={errors.type?.message}
              />
            )}
          />
        </div>
        
        {/* Task Description */}
        <div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Description"
                placeholder="Enter task description"
                multiline
                rows={3}
                error={errors.description?.message}
              />
            )}
          />
        </div>
        
        {/* Due Date */}
        <div>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                label="Due Date"
                error={errors.dueDate?.message}
              />
            )}
          />
        </div>
        
        {/* Task Order */}
        <div>
          <Controller
            name="order"
            control={control}
            rules={{ 
              required: 'Order is required',
              min: { value: 1, message: 'Order must be at least 1' }
            }}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                label="Order"
                placeholder="Task execution order"
                min="1"
                error={errors.order?.message}
              />
            )}
          />
        </div>
        
        {/* Dependencies */}
        {dependencyOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependencies
            </label>
            <p className="text-xs text-gray-500 mb-2">
              This task will only be actionable after these tasks are completed.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {dependencyOptions.map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`dep-${option.value}`}
                    value={option.value}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    onChange={(e) => {
                      const currentDeps = watch('dependsOn') || [];
                      if (e.target.checked) {
                        setValue('dependsOn', [...currentDeps, option.value]);
                      } else {
                        setValue('dependsOn', currentDeps.filter(id => id !== option.value));
                      }
                    }}
                    checked={watch('dependsOn')?.includes(option.value)}
                  />
                  <label
                    htmlFor={`dep-${option.value}`}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {option.label} (Task {existingTasks.find(t => t.taskId === option.value)?.order})
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Type-specific fields */}
        {watchedType === 'FileDocument' && (
          <div className="p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Document Filing Options</h4>
            <p className="text-xs text-blue-700">
              Document filing options will be added in a future update.
            </p>
          </div>
        )}
        
        {watchedType === 'ScheduleHearing' && (
          <div className="p-3 bg-purple-50 rounded-md">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Hearing Options</h4>
            <p className="text-xs text-purple-700">
              Hearing scheduling options will be added in a future update.
            </p>
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditMode ? 'Update Task' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkflowTaskForm;