import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { 
  Play, Plus, Filter, Search, Check, 
  CheckCircle, Clock, AlertCircle, Copy
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import Modal from '../ui/Modal';
import WorkflowForm from './WorkflowForm';
import { Workflow } from '../../types/schema';

const WorkflowDashboard: React.FC = () => {
  const { state } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isTemplateView, setIsTemplateView] = useState(false);
  
  const itemsPerPage = 10;

  // Filter workflows based on search, case, and status
  const filteredWorkflows = state.workflows.filter(workflow => {
    // First filter by template/active workflows
    if (isTemplateView && !workflow.isTemplate) return false;
    if (!isTemplateView && workflow.isTemplate) return false;
    
    const matchesSearch = searchTerm === '' || 
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workflow.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCase = caseFilter === '' || workflow.caseId === caseFilter;
    
    const isActive = !workflow.completedAt;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'completed' && !isActive);
    
    return matchesSearch && matchesCase && matchesStatus;
  });

  // Sort workflows by creation date (newest first)
  const sortedWorkflows = [...filteredWorkflows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Paginate
  const totalPages = Math.ceil(sortedWorkflows.length / itemsPerPage);
  const paginatedWorkflows = sortedWorkflows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const openWorkflowForm = (workflowId: string | null = null) => {
    setSelectedWorkflowId(workflowId);
    setIsFormModalOpen(true);
  };

  const closeWorkflowForm = () => {
    setIsFormModalOpen(false);
    setSelectedWorkflowId(null);
  };

  const viewWorkflowDetails = (workflowId: string) => {
    navigate(`/workflows/${workflowId}`);
  };

  // Get case options for filter
  const caseOptions = [
    { value: '', label: 'All Cases' },
    ...state.cases.map(c => ({
      value: c.caseId,
      label: `${c.plaintiff} v. ${c.defendant}`
    }))
  ];

  // Calculate progress for a workflow
  const calculateProgress = (workflow: Workflow) => {
    const tasks = state.workflowTasks.filter(t => t.workflowId === workflow.workflowId);
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.isComplete).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Table columns
  const columns = [
    {
      header: 'Workflow',
      accessor: (workflow: Workflow) => (
        <div>
          <div className="font-medium text-gray-900">{workflow.name}</div>
          {workflow.description && (
            <div className="text-sm text-gray-500 mt-1">{workflow.description}</div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Case',
      accessor: (workflow: Workflow) => {
        if (workflow.isTemplate) return 'Template';
        
        const relatedCase = state.cases.find(c => c.caseId === workflow.caseId);
        return relatedCase 
          ? `${relatedCase.plaintiff} v. ${relatedCase.defendant}`
          : 'Unknown Case';
      },
      sortable: true,
    },
    {
      header: 'Progress',
      accessor: (workflow: Workflow) => {
        const progress = calculateProgress(workflow);
        const progressClasses = 
          progress === 100 ? 'bg-green-500' : 
          progress > 50 ? 'bg-blue-500' : 
          'bg-yellow-500';
        
        return (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
              <div 
                className={`h-2.5 rounded-full ${progressClasses}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        );
      },
      sortable: false,
    },
    {
      header: 'Status',
      accessor: (workflow: Workflow) => (
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
      ),
      sortable: false,
    },
    {
      header: 'Created',
      accessor: (workflow: Workflow) => format(new Date(workflow.createdAt), 'MMM d, yyyy'),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (workflow: Workflow) => (
        <div className="flex space-x-2">
          <Button
            variant="text"
            size="sm"
            icon={<Play size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              viewWorkflowDetails(workflow.workflowId);
            }}
            aria-label="View workflow"
          />
          {workflow.isTemplate && (
            <Button
              variant="text"
              size="sm"
              icon={<Copy size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                // Duplicate template logic would go here
              }}
              aria-label="Duplicate template"
            />
          )}
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define and manage automated workflows for your legal cases
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={isTemplateView ? 'outline' : 'primary'}
            onClick={() => setIsTemplateView(false)}
          >
            Active Workflows
          </Button>
          <Button
            variant={isTemplateView ? 'primary' : 'outline'}
            onClick={() => setIsTemplateView(true)}
          >
            Templates
          </Button>
          <Button 
            onClick={() => openWorkflowForm()} 
            icon={<Plus size={16} />}
          >
            {isTemplateView ? 'New Template' : 'New Workflow'}
          </Button>
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          {!isTemplateView && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Filter size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Filters:</span>
              </div>
              
              <Select
                options={caseOptions}
                value={caseFilter}
                onChange={(e) => handleFilterChange(setCaseFilter, e.target.value)}
                placeholder="Case"
                className="w-full sm:w-auto"
              />
              
              <Select
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                ]}
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                placeholder="Status"
                className="w-full sm:w-auto"
              />
            </div>
          )}
        </div>

        {/* Workflow Statistics */}
        {!isTemplateView && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-900">Active Workflows</p>
                  <p className="text-2xl font-semibold text-blue-700 mt-1">
                    {state.workflows.filter(w => !w.isTemplate && w.isActive && !w.completedAt).length}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100">
                  <Play size={20} className="text-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-yellow-900">In Progress</p>
                  <p className="text-2xl font-semibold text-yellow-700 mt-1">
                    {
                      state.workflows
                        .filter(w => !w.isTemplate && w.isActive && !w.completedAt)
                        .filter(w => {
                          const tasks = state.workflowTasks.filter(t => t.workflowId === w.workflowId);
                          return tasks.some(t => t.isComplete) && tasks.some(t => !t.isComplete);
                        }).length
                    }
                  </p>
                </div>
                <div className="p-2 rounded-full bg-yellow-100">
                  <Clock size={20} className="text-yellow-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-green-900">Completed</p>
                  <p className="text-2xl font-semibold text-green-700 mt-1">
                    {state.workflows.filter(w => !w.isTemplate && w.completedAt).length}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle size={20} className="text-green-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Statistics */}
        {isTemplateView && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-purple-900">Available Templates</p>
                  <p className="text-2xl font-semibold text-purple-700 mt-1">
                    {state.workflows.filter(w => w.isTemplate).length}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-purple-100">
                  <Copy size={20} className="text-purple-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-900">Applied Templates</p>
                  <p className="text-2xl font-semibold text-blue-700 mt-1">
                    {/* This would typically track how many workflows were created from templates */}
                    0
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100">
                  <Check size={20} className="text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflows table */}
        <Table 
          data={paginatedWorkflows}
          columns={columns}
          keyField="workflowId"
          onRowClick={(workflow) => viewWorkflowDetails(workflow.workflowId)}
          emptyMessage={
            isTemplateView 
              ? "No workflow templates found. Create a new template to get started." 
              : "No workflows found. Create a new workflow to get started."
          }
        />
        
        {/* Pagination */}
        <Pagination
          totalItems={filteredWorkflows.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* Workflow Form Modal */}
      {isFormModalOpen && (
        <WorkflowForm
          isOpen={isFormModalOpen}
          onClose={closeWorkflowForm}
          workflowId={selectedWorkflowId}
          isTemplate={isTemplateView}
        />
      )}
    </div>
  );
};

export default WorkflowDashboard;