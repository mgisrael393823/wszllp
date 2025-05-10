import React, { useState } from 'react';
import { Search, Plus, Filter, Download, X, Check, AlertCircle, Info } from 'lucide-react';

// Import UI components
import Typography from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Table from '../ui/Table';

// Demo data
interface Case {
  id: string;
  caseNumber: string;
  title: string;
  client: string;
  status: string;
  type: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

const DEMO_CASES: Case[] = [
  {
    id: '1',
    caseNumber: 'CASE-2023-001',
    title: 'Smith v. Johnson Property Dispute',
    client: 'Michael Smith',
    status: 'Active',
    type: 'Property',
    date: '2023-05-15',
    priority: 'high'
  },
  {
    id: '2',
    caseNumber: 'CASE-2023-008',
    title: 'Williams Bankruptcy Filing',
    client: 'Sarah Williams',
    status: 'Pending',
    type: 'Bankruptcy',
    date: '2023-06-22',
    priority: 'medium'
  },
  {
    id: '3',
    caseNumber: 'CASE-2023-014',
    title: 'Rodriguez Child Custody',
    client: 'Maria Rodriguez',
    status: 'Active',
    type: 'Family',
    date: '2023-04-10',
    priority: 'high'
  },
  {
    id: '4',
    caseNumber: 'CASE-2023-019',
    title: 'Thompson LLC Contract Review',
    client: 'Thompson LLC',
    status: 'Completed',
    type: 'Business',
    date: '2023-07-05',
    priority: 'low'
  },
  {
    id: '5',
    caseNumber: 'CASE-2023-023',
    title: 'Davis Medical Malpractice',
    client: 'Robert Davis',
    status: 'Active',
    type: 'Medical',
    date: '2023-03-18',
    priority: 'high'
  }
];

// Status options for select
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

// Type options for select
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'property', label: 'Property' },
  { value: 'family', label: 'Family' },
  { value: 'business', label: 'Business' },
  { value: 'bankruptcy', label: 'Bankruptcy' },
  { value: 'medical', label: 'Medical' },
  { value: 'criminal', label: 'Criminal' }
];

// Table columns configuration
const CASE_COLUMNS = [
  {
    header: 'Case Number',
    accessor: 'caseNumber',
    sortable: true,
    width: '15%'
  },
  {
    header: 'Title',
    accessor: 'title',
    sortable: true,
    width: '30%'
  },
  {
    header: 'Client',
    accessor: 'client',
    sortable: true,
    width: '15%'
  },
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
    width: '10%',
    renderCell: (value: string) => {
      const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
          case 'active':
            return 'bg-success-100 text-success-700 border-success-200';
          case 'pending':
            return 'bg-warning-100 text-warning-700 border-warning-200';
          case 'completed':
            return 'bg-secondary-100 text-secondary-700 border-secondary-200';
          default:
            return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(value)}`}>
          {value}
        </span>
      );
    }
  },
  {
    header: 'Type',
    accessor: 'type',
    sortable: true,
    width: '10%'
  },
  {
    header: 'Date',
    accessor: 'date',
    sortable: true,
    width: '10%',
    renderCell: (value: string) => {
      const date = new Date(value);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  },
  {
    header: 'Priority',
    accessor: 'priority',
    sortable: true,
    width: '10%',
    renderCell: (value: string) => {
      const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
          case 'high':
            return 'bg-error-100 text-error-700 border-error-200';
          case 'medium':
            return 'bg-warning-100 text-warning-700 border-warning-200';
          case 'low':
            return 'bg-success-100 text-success-700 border-success-200';
          default:
            return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getPriorityColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      );
    }
  }
];

const DesignSystemShowcase: React.FC = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardCards, setDashboardCards] = useState([
    { id: 'active', title: 'Active Cases', count: 35, change: 5, changeType: 'increase' },
    { id: 'pending', title: 'Pending Cases', count: 12, change: 2, changeType: 'increase' },
    { id: 'urgent', title: 'Urgent Actions', count: 8, change: -3, changeType: 'decrease' },
    { id: 'completed', title: 'Completed This Month', count: 24, change: 10, changeType: 'increase' }
  ]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleCaseClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };

  const handleFilter = () => {
    setIsLoading(true);
    setIsFilterModalOpen(false);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Would trigger download in real application
      alert('Cases exported successfully!');
    }, 1000);
  };

  return (
    <div className="container-custom py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <Typography variant="h1" className="mb-2">Case Management</Typography>
          <Typography variant="body1" color="light" className="mt-0">
            View and manage all legal cases in the system.
          </Typography>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="md"
            icon={<Filter size={16} />}
            onClick={() => setIsFilterModalOpen(true)}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={<Download size={16} />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            elevation="low"
          >
            New Case
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map(card => (
          <Card 
            key={card.id}
            className="hover-lift shadow-transition hover:shadow-md"
            variant={
              card.id === 'active' ? 'primary' :
              card.id === 'pending' ? 'warning' :
              card.id === 'urgent' ? 'error' : 'success'
            }
            compact
          >
            <div className="flex flex-col">
              <Typography variant="h3" className="mb-1">{card.count}</Typography>
              <Typography variant="body2" className="mb-3">{card.title}</Typography>
              <div className="flex items-center mt-auto">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center ${
                  card.changeType === 'increase' 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-error-100 text-error-700'
                }`}>
                  {card.changeType === 'increase' ? '+' : ''}{card.change}%
                  {card.changeType === 'increase' 
                    ? <Check size={12} className="ml-1" /> 
                    : <AlertCircle size={12} className="ml-1" />}
                </span>
                <Typography variant="caption" className="ml-2" color="light">from last month</Typography>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex">
            <div className="w-full relative">
              <Input
                type="text"
                placeholder="Search cases by title, case number, or client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={16} />}
                fullWidth
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="ml-2 hidden md:flex"
            >
              Search
            </Button>
          </form>
          <div className="flex gap-4">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Status"
              className="w-40"
            />
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Type"
              className="w-40"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="md:hidden"
            >
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Alert */}
      <div className="mb-8 bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start">
        <div className="text-primary-600 mr-3 mt-0.5">
          <Info size={20} />
        </div>
        <div>
          <Typography variant="subtitle2" className="text-primary-800 mb-1">
            New Features Available
          </Typography>
          <Typography variant="body2" className="text-primary-700 mb-0">
            The case management system has been updated with new features. Check out the documentation for more information.
          </Typography>
        </div>
        <Button
          variant="text"
          size="sm"
          className="ml-auto mt-0.5"
          icon={<X size={16} />}
        />
      </div>

      {/* Cases Table */}
      <Typography variant="h2" className="mb-4">All Cases</Typography>
      <Table
        data={DEMO_CASES}
        columns={CASE_COLUMNS}
        keyField="id"
        onRowClick={handleCaseClick}
        isLoading={isLoading}
        variant="default"
        density="default"
        size="md"
        highlightOnHover
        stickyHeader
        footer={
          <tr>
            <td colSpan={7} className="px-4 py-3">
              <div className="flex justify-between items-center">
                <Typography variant="body2">Showing 5 of 46 cases</Typography>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </td>
          </tr>
        }
      />

      {/* Case Detail Modal */}
      {selectedCase && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Case Details"
          subtitle={`Last updated: ${new Date().toLocaleDateString()}`}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
              <Button variant="primary">Edit Case</Button>
            </>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="subtitle2" color="light">Case Number</Typography>
                <Typography>{selectedCase.caseNumber}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="light">Date Filed</Typography>
                <Typography>{new Date(selectedCase.date).toLocaleDateString()}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="light">Client</Typography>
                <Typography>{selectedCase.client}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="light">Status</Typography>
                <Typography>{selectedCase.status}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="light">Type</Typography>
                <Typography>{selectedCase.type}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="light">Priority</Typography>
                <Typography>{selectedCase.priority}</Typography>
              </div>
            </div>

            <div>
              <Typography variant="subtitle2" color="light">Description</Typography>
              <Typography>
                This is a sample case description that would contain details about the case, 
                including key facts, issues, and procedural history. In a real application,
                this would be populated with actual case information.
              </Typography>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <Typography variant="subtitle1" className="mb-3">Recent Activity</Typography>
              <div className="space-y-2 vr-sm">
                <div className="flex justify-between items-center">
                  <Typography variant="body2">Document uploaded: <span className="text-primary-600">case_brief.pdf</span></Typography>
                  <Typography variant="caption" color="light">2 days ago</Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="body2">Status changed from <span className="text-warning-600">Pending</span> to <span className="text-success-600">Active</span></Typography>
                  <Typography variant="caption" color="light">4 days ago</Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="body2">Note added by <span className="text-primary-600">Jane Smith</span></Typography>
                  <Typography variant="caption" color="light">1 week ago</Typography>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Advanced Filters"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleFilter}>Apply Filters</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Typography variant="body2" className="mb-4">
            Use the filters below to narrow down your case list. You can combine multiple filters.
          </Typography>
          
          <Input
            label="Date Range Start"
            type="date"
            fullWidth
          />
          
          <Input
            label="Date Range End"
            type="date"
            fullWidth
          />
          
          <Select
            label="Case Status"
            options={[
              { value: '', label: 'Select Status' },
              ...STATUS_OPTIONS.filter(o => o.value !== 'all')
            ]}
            fullWidth
          />
          
          <Select
            label="Case Type"
            options={[
              { value: '', label: 'Select Type' },
              ...TYPE_OPTIONS.filter(o => o.value !== 'all')
            ]}
            fullWidth
          />
          
          <Select
            label="Priority"
            options={[
              { value: '', label: 'Select Priority' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            fullWidth
          />
          
          <Input
            label="Assigned Attorney"
            type="text"
            placeholder="Enter attorney name"
            fullWidth
          />

          <div className="pt-2">
            <Button variant="text" size="sm" className="text-primary-600">
              <span>Reset All Filters</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DesignSystemShowcase;