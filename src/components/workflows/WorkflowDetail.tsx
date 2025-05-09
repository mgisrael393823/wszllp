import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import {
  ArrowLeft, Plus, Check, Play, Edit, Trash2,
  AlertTriangle, Clock, CheckCircle, List, AlertCircle
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import WorkflowForm from './WorkflowForm';
import WorkflowTaskForm from './WorkflowTaskForm';
import { Workflow, WorkflowTask } from '../../types/schema';

const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  
  // State for modals
  const [isWorkflowEditModalOpen, setIsWorkflowEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const workflow = state.workflows.find(w => w.workflowId === id);
  const workflowTasks = state.workflowTasks
    .filter(t => t.workflowId === id)
    .sort((a, b) => a.order - b.order);
  
  if (!workflow) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Workflow not found</h2>
        <p className="mt-2 text-gray-600">The requested workflow could not be found.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/workflows')}
          className="mt-4"
          icon={<ArrowLeft size={16} />}
        >
          Back to Workflows
        </Button>
      </div>
    );
  }

  // Find related case if not a template
  const relatedCase = !workflow.isTemplate 
    ? state.cases.find(c => c.caseId === workflow.caseId) 
    : null;

  // Calculate workflow progress
  const calculateProgress = () => {
    if (workflowTasks.length === 0) return 0;
    const completedTasks = workflowTasks.filter(t => t.isComplete).length;
    return Math.round((completedTasks / workflowTasks.length) * 100);
  };

  const progress = calculateProgress();
  
  // Open task form modal
  const openTaskForm = (taskId: string | null = null) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };
  
  // Close task form modal
  const closeTaskForm = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
  };
  
  // Handle marking a task as complete
  const completeTask = (taskId: string) => {
    dispatch({ type: 'COMPLETE_WORKFLOW_TASK', payload: taskId });
  };
  
  // Open delete confirmation modal
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  
  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };
  
  // Handle workflow deletion
  const deleteWorkflow = () => {
    dispatch({ type: 'DELETE_WORKFLOW', payload: workflow.workflowId });
    navigate('/workflows');
  };

  // Determine task status icon based on completion status
  const getTaskStatusIcon = (task: WorkflowTask) => {
    if (task.isComplete) {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    
    // Check if dependencies are complete
    if (task.dependsOn && task.dependsOn.length > 0) {
      const dependenciesComplete = task.dependsOn.every(depId => {
        const depTask = workflowTasks.find(t => t.taskId === depId);
        return depTask && depTask.isComplete;
      });
      
      if (!dependenciesComplete) {
        return <Clock size={20} className="text-gray-400" />;
      }
    }
    
    // Task is ready to be worked on
    return <Play size={20} className="text-blue-500" />;
  };

  // Format date with time or return placeholder text
  const formatDateOrPlaceholder = (date: string | undefined, placeholder: string = 'Not set') => {
    return date ? format(new Date(date), 'MMM d, yyyy h:mm a') : placeholder;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/workflows')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {workflow.name}
              {workflow.isTemplate && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Template
                </span>
              )}
            </h1>
            {relatedCase && (
              <p className="mt-1 text-sm text-gray-500">
                Case: {relatedCase.plaintiff} v. {relatedCase.defendant}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsWorkflowEditModalOpen(true)}
            icon={<Edit size={16} />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={openDeleteModal}
            icon={<Trash2 size={16} />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Workflow Status and Progress */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Details</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${workflow.completedAt 
                      ? 'bg-green-100 text-green-800' 
                      : workflow.isActive 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'}`
                  }>
                    {workflow.completedAt 
                      ? 'Completed' 
                      : workflow.isActive 
                        ? 'Active' 
                        : 'Inactive'}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Trigger Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workflow.triggerType || 'Manual'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateOrPlaceholder(workflow.createdAt)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateOrPlaceholder(workflow.updatedAt)}
                </dd>
              </div>
              
              {workflow.completedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateOrPlaceholder(workflow.completedAt)}
                  </dd>
                </div>
              )}
              
              {workflow.description && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{workflow.description}</dd>
                </div>
              )}
            </dl>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{progress}% complete</span>
              <span className="text-sm text-gray-500">
                {workflowTasks.filter(t => t.isComplete).length} / {workflowTasks.length} tasks
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div 
                className={`h-4 rounded-full ${
                  progress === 100 ? 'bg-green-500' : 
                  progress > 50 ? 'bg-blue-500' : 
                  'bg-yellow-500'
                }`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  <span className="text-sm font-medium text-blue-900">Pending Tasks</span>
                </div>
                <p className="text-2xl font-semibold text-blue-700 mt-2">
                  {workflowTasks.filter(t => !t.isComplete).length}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-sm font-medium text-green-900">Completed Tasks</span>
                </div>
                <p className="text-2xl font-semibold text-green-700 mt-2">
                  {workflowTasks.filter(t => t.isComplete).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
          <Button
            onClick={() => openTaskForm()}
            icon={<Plus size={16} />}
            size="sm"
          >
            Add Task
          </Button>
        </div>
        
        <div className="space-y-4">
          {workflowTasks.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <List className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a task to this workflow.</p>
              <div className="mt-6">
                <Button
                  onClick={() => openTaskForm()}
                  icon={<Plus size={16} />}
                >
                  Add Task
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200"></div>
              
              {/* Tasks */}
              <div className="space-y-6">
                {workflowTasks.map((task, index) => {
                  // Check if all dependencies are complete
                  const dependenciesComplete = !task.dependsOn || task.dependsOn.length === 0 || 
                    task.dependsOn.every(depId => {
                      const depTask = workflowTasks.find(t => t.taskId === depId);
                      return depTask && depTask.isComplete;
                    });
                  
                  // Determine if task is actionable
                  const isActionable = !task.isComplete && dependenciesComplete;
                  
                  return (
                    <div key={task.taskId} className="relative pl-11">
                      {/* Timeline node */}
                      <div className="absolute left-3.5 -translate-x-1/2 mt-1.5">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center
                          ${task.isComplete 
                            ? 'bg-green-100 border-green-500' 
                            : !dependenciesComplete
                              ? 'bg-gray-100 border-gray-400'
                              : 'bg-blue-100 border-blue-500'
                          }`}
                        >
                          {getTaskStatusIcon(task)}
                        </div>
                      </div>
                      
                      {/* Task content */}
                      <div className={`p-4 border rounded-lg ${
                        task.isComplete 
                          ? 'border-green-200 bg-green-50' 
                          : !dependenciesComplete
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-blue-200 bg-blue-50'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              {task.name}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {task.type}
                              </span>
                            </h4>
                            {task.description && (
                              <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                            )}
                            
                            {/* Due date */}
                            {task.dueDate && (
                              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={14} />
                                Due by: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </p>
                            )}
                            
                            {/* Dependency warning */}
                            {!dependenciesComplete && !task.isComplete && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700">
                                <AlertCircle size={14} className="text-yellow-500" />
                                Waiting for preceding tasks to be completed
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-2">
                            {isActionable && (
                              <Button
                                variant="success"
                                size="sm"
                                icon={<Check size={16} />}
                                onClick={() => completeTask(task.taskId)}
                              >
                                Complete
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Edit size={16} />}
                              onClick={() => openTaskForm(task.taskId)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                        
                        {/* Completion information */}
                        {task.isComplete && task.completedAt && (
                          <div className="mt-2 text-xs text-green-700 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Completed on {format(new Date(task.completedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Workflow Modal */}
      {isWorkflowEditModalOpen && (
        <WorkflowForm
          isOpen={isWorkflowEditModalOpen}
          onClose={() => setIsWorkflowEditModalOpen(false)}
          workflowId={workflow.workflowId}
          isTemplate={workflow.isTemplate}
        />
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <WorkflowTaskForm
          isOpen={isTaskModalOpen}
          onClose={closeTaskForm}
          workflowId={workflow.workflowId}
          taskId={selectedTaskId}
          existingTasks={workflowTasks}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Workflow"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Delete "{workflow.name}"?</h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone. This will permanently delete the workflow 
                and all of its tasks.
              </p>
            </div>
          </div>

          {workflowTasks.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-700 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
              <p>
                This workflow has {workflowTasks.length} task{workflowTasks.length !== 1 ? 's' : ''}.
                All tasks will be deleted along with this workflow.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteWorkflow}
            >
              Delete Workflow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowDetail;