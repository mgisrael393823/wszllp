import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useInvoices } from '../../hooks/useInvoices';
import { format, parseISO, isValid } from 'date-fns';
import { 
  ArrowLeft, Plus, Calendar, FileText, Edit, 
  Clock, User, CreditCard, Download,
  MapPin, Activity, MoreVertical, Printer, CalendarDays,
  Scale, AlertCircle
} from 'lucide-react';
import { StatusCard, MetricCard, ActionListCard } from '../ui';
import Button from '../ui/Button';
import { DataTable } from '../ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import HearingForm from '../hearings/HearingForm';
import DocumentForm from '../documents/DocumentForm';
import InvoiceForm from '../invoices/InvoiceForm';
import CaseForm from './CaseForm';
import CaseTimelineView from './CaseTimelineView';
import CaseFinancialStatus from './CaseFinancialStatus';
import { getStatusColor, getStatusBackground } from '../../utils/statusColors';
import Pagination from '../ui/Pagination';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useData();
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditCaseModalOpen, setIsEditCaseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'hearings' | 'documents' | 'invoices' | 'financial' | 'activity'>('timeline');
  const [currentPage, setCurrentPage] = useState(1);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['timeline', 'hearings', 'documents', 'invoices', 'financial', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam as typeof activeTab);
    }
  }, [searchParams]);

  const itemsPerPage = 5;

  const caseData = state.cases.find(c => c.caseId === id);
  const caseHearings = state.hearings.filter(h => h.caseId === id);
  const caseDocuments = state.documents.filter(d => d.caseId === id);
  
  // Get invoices from Supabase
  const { invoices: caseInvoices = [], isLoading: invoicesLoading } = useInvoices({ caseId: id });
  
  // Get audit logs related to this case
  const caseAuditLogs = state.auditLogs.filter(
    log => log.entityId === id || 
    caseHearings.some(h => h.hearingId === log.entityId) ||
    caseDocuments.some(d => d.docId === log.entityId) ||
    caseInvoices.some(i => i.invoiceId === log.entityId)
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Get related data based on active tab for pagination
  const getActiveTabData = () => {
    switch (activeTab) {
      case 'timeline':
        return []; // Timeline doesn't use pagination
      case 'hearings':
        return caseHearings;
      case 'documents':
        return caseDocuments;
      case 'invoices':
        return caseInvoices;
      case 'financial':
        return []; // Financial doesn't use pagination
      case 'activity':
        return caseAuditLogs;
      default:
        return [];
    }
  };

  const activeTabData = getActiveTabData();
  const paginatedData = activeTabData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-neutral-900">Case not found</h2>
        <p className="mt-2 text-neutral-600">The requested case could not be found.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/cases')}
          className="mt-4"
          icon={<ArrowLeft size={16} />}
        >
          Back to Cases
        </Button>
      </div>
    );
  }

  // Calculate case statistics
  const upcomingHearings = caseHearings.filter(h => new Date(h.hearingDate) > new Date()).length;
  const pendingDocuments = caseDocuments.filter(d => d.status === 'Pending').length;
  const scheduledHearing = caseHearings
    .filter(h => new Date(h.hearingDate) > new Date())
    .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())[0];
  
  // Case age in days
  const caseAge = Math.ceil(
    (new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format intake date
  const intakeDate = typeof caseData.intakeDate === 'string'
    ? parseISO(caseData.intakeDate)
    : caseData.intakeDate instanceof Date
    ? caseData.intakeDate
    : null;
  const formattedIntakeDate = intakeDate && isValid(intakeDate)
    ? format(intakeDate, 'MMMM d, yyyy')
    : 'Not specified';

  // Format next hearing date
  const nextHearingText = scheduledHearing ? (() => {
    const date = typeof scheduledHearing.hearingDate === 'string'
      ? parseISO(scheduledHearing.hearingDate)
      : scheduledHearing.hearingDate instanceof Date
      ? scheduledHearing.hearingDate
      : null;
    return date && isValid(date)
      ? format(date, 'MMM d, yyyy \'at\' h:mm a')
      : 'Invalid Date';
  })() : 'No upcoming hearings';

  // Map case status to StatusCard status
  const getCardStatus = (status: string): 'active' | 'pending' | 'completed' | 'overdue' | 'draft' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'open':
        return 'active';
      case 'pending':
        return 'pending';
      case 'closed':
      case 'resolved':
        return 'completed';
      case 'overdue':
        return 'overdue';
      default:
        return 'draft';
    }
  };

  // Quick action items for the case
  const quickActionItems = [
    {
      id: 'edit-case',
      icon: Edit,
      title: 'Edit Case Details',
      subtitle: 'Update case information',
      onClick: () => setIsEditCaseModalOpen(true)
    },
    {
      id: 'view-calendar',
      icon: CalendarDays,
      title: 'View in Calendar',
      subtitle: 'See all case events',
      onClick: () => navigate('/calendar')
    },
    {
      id: 'print-details',
      icon: Printer,
      title: 'Print Case Summary',
      subtitle: 'Generate printable report',
      onClick: () => {
        // Print functionality would be implemented here
        console.log('Print case details');
      }
    },
    {
      id: 'add-hearing',
      icon: Calendar,
      title: 'Schedule Hearing',
      subtitle: 'Add new court date',
      onClick: () => setIsHearingModalOpen(true)
    },
    {
      id: 'upload-doc',
      icon: FileText,
      title: 'Upload Document',
      subtitle: 'Add files to case',
      onClick: () => setIsDocumentModalOpen(true)
    }
  ];

  // Table configurations for different tabs
  const hearingColumns: ColumnDef<typeof state.hearings[0]>[] = [
    {
      accessorKey: 'courtName',
      header: 'Court',
    },
    {
      accessorKey: 'hearingDate',
      header: 'Date',
      cell: ({ row }) => {
        const date = typeof row.original.hearingDate === 'string'
          ? parseISO(row.original.hearingDate)
          : row.original.hearingDate instanceof Date
          ? row.original.hearingDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
    },
    {
      accessorKey: 'hearingDate',
      header: 'Time',
      cell: ({ row }) => {
        const date = typeof row.original.hearingDate === 'string'
          ? parseISO(row.original.hearingDate)
          : row.original.hearingDate instanceof Date
          ? row.original.hearingDate
          : null;
        return date && isValid(date)
          ? format(date, 'h:mm a')
          : 'Invalid Date';
      },
    },
    {
      accessorKey: 'outcome',
      header: 'Outcome',
      cell: ({ row }) => row.original.outcome || 'Pending',
    },
  ];

  const documentColumns: ColumnDef<typeof state.documents[0]>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${row.original.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
              row.original.status === 'Served' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`
          }
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = typeof row.original.createdAt === 'string'
          ? parseISO(row.original.createdAt)
          : row.original.createdAt instanceof Date
          ? row.original.createdAt
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="text"
          size="sm"
          icon={<Download size={16} />}
          aria-label="Download document"
          onClick={() => {
            if (row.original.fileURL) {
              window.open(row.original.fileURL, '_blank');
            }
          }}
        />
      ),
    }
  ];

  const invoiceColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'invoiceId',
      header: 'Invoice #',
      cell: ({ row }) => row.original.invoiceId?.slice(0, 8) || 'N/A',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || 'No description',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `$${(row.original.amount || 0).toFixed(2)}`,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const date = typeof row.original.dueDate === 'string'
          ? parseISO(row.original.dueDate)
          : row.original.dueDate instanceof Date
          ? row.original.dueDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'N/A';
      },
    },
    {
      accessorKey: 'paid',
      header: 'Status',
      cell: ({ row }) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${row.original.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }
        >
          {row.original.paid ? 'Paid' : 'Unpaid'}
        </span>
      ),
    },
  ];

  const activityColumns: ColumnDef<typeof state.auditLogs[0]>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }) => {
        const date = typeof row.original.timestamp === 'string'
          ? parseISO(row.original.timestamp)
          : row.original.timestamp instanceof Date
          ? row.original.timestamp
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, h:mm a')
          : 'Invalid Date';
      },
    },
    {
      accessorKey: 'action',
      header: 'Activity',
      cell: ({ row }) => {
        const actionColors = {
          'Create': 'text-green-700',
          'Update': 'text-blue-700',
          'Delete': 'text-red-700'
        };
        return (
          <span className={actionColors[row.original.action as keyof typeof actionColors] || ''}>
            {row.original.details}
          </span>
        );
      },
    },
    {
      accessorKey: 'entityType',
      header: 'Entity Type',
    }
  ];

  // Function to get the active tab's columns
  const getActiveTabColumns = () => {
    switch (activeTab) {
      case 'hearings':
        return hearingColumns;
      case 'documents':
        return documentColumns;
      case 'invoices':
        return invoiceColumns;
      case 'activity':
        return activityColumns;
      default:
        return [];
    }
  };

  // Function to get empty message based on the active tab
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'hearings':
        return 'No hearings scheduled yet.';
      case 'documents':
        return 'No documents added to this case.';
      case 'invoices':
        return 'No invoices issued for this case.';
      case 'financial':
        return ''; // Financial tab doesn't use this
      case 'activity':
        return 'No activity recorded for this case.';
      default:
        return 'No data available.';
    }
  };

  // Function to handle add action based on the active tab
  const handleAddButtonClick = () => {
    switch (activeTab) {
      case 'hearings':
        setIsHearingModalOpen(true);
        break;
      case 'documents':
        setIsDocumentModalOpen(true);
        break;
      case 'invoices':
        setIsInvoiceModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Function to determine if Add button should be shown
  const shouldShowAddButton = () => {
    return activeTab !== 'activity' && activeTab !== 'financial';
  };

  const unpaidAmount = caseInvoices.filter(i => !i.paid).reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/cases')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          <div>
            <h1 className="page-title">
              {caseData.plaintiff} v. {caseData.defendant}
            </h1>
            <p className="page-subtitle">
              Case #{caseData.caseId}
            </p>
          </div>
        </div>
      </div>

      {/* Main Case Status Card */}
      <StatusCard
        title={`${caseData.plaintiff} v. ${caseData.defendant}`}
        status={getCardStatus(caseData.status)}
        subtitle={`Case #${caseData.caseId} • ${caseData.address}`}
        description={scheduledHearing ? `Next hearing: ${nextHearingText}` : 'No upcoming hearings scheduled'}
        icon={Scale}
        metadata={[
          { label: "Status", value: caseData.status },
          { label: "Intake Date", value: formattedIntakeDate },
          { label: "Case Age", value: `${caseAge} days` },
          { label: "Property", value: caseData.address || 'Not specified' }
        ]}
        actions={[
          { label: "Edit Case", onClick: () => setIsEditCaseModalOpen(true), variant: 'outline' },
          { label: "View Calendar", onClick: () => navigate('/calendar'), variant: 'outline' }
        ]}
        className="mb-6"
      />

      {/* Case Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Upcoming Hearings"
          value={upcomingHearings}
          icon={Calendar}
          subtitle="Court appearances"
          onClick={() => setActiveTab('hearings')}
        />
        <MetricCard
          title="Pending Documents"
          value={pendingDocuments}
          icon={AlertCircle}
          subtitle="Require attention"
          trend={pendingDocuments > 0 ? { value: `${pendingDocuments} pending`, isPositive: false } : undefined}
          onClick={() => setActiveTab('documents')}
        />
        <MetricCard
          title="Total Documents"
          value={caseDocuments.length}
          icon={FileText}
          subtitle="In case file"
          onClick={() => setActiveTab('documents')}
        />
        <MetricCard
          title="Unpaid Amount"
          value={`$${unpaidAmount.toFixed(2)}`}
          icon={CreditCard}
          subtitle="Outstanding balance"
          trend={unpaidAmount > 0 ? { value: "Due", isPositive: false } : { value: "Paid", isPositive: true }}
          onClick={() => setActiveTab('invoices')}
        />
      </div>

      {/* Quick Actions and Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <ActionListCard
            title="Quick Actions"
            description="Common case tasks"
            items={quickActionItems}
          />
        </div>

        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-6">
              <nav className="-mb-px flex space-x-6">
                {(['timeline', 'hearings', 'documents', 'invoices', 'financial', 'activity'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`
                      whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}
                    `}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab !== 'timeline' && tab !== 'financial' && (
                      <span className="ml-2 bg-neutral-100 text-neutral-600 py-0.5 px-2 rounded-full text-xs">
                        {getActiveTabData().length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'timeline' ? (
                <CaseTimelineView caseId={id!} />
              ) : activeTab === 'financial' ? (
                <CaseFinancialStatus caseId={id!} />
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-neutral-900">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h3>
                    
                    {shouldShowAddButton() && (
                      <Button
                        onClick={handleAddButtonClick}
                        icon={<Plus size={16} />}
                        size="sm"
                      >
                        Add {activeTab.slice(0, -1)}
                      </Button>
                    )}
                  </div>
                  
                  <DataTable
                    data={paginatedData}
                    columns={getActiveTabColumns()}
                    isLoading={false}
                    error={null}
                    className="border-0 shadow-none"
                  />

                  {activeTabData.length > itemsPerPage && (
                    <div className="mt-4">
                      <Pagination
                        totalItems={activeTabData.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isHearingModalOpen && (
        <HearingForm
          isOpen={isHearingModalOpen}
          onClose={() => setIsHearingModalOpen(false)}
          hearingId={null}
          defaultCaseId={id}
        />
      )}

      {isDocumentModalOpen && (
        <DocumentForm
          isOpen={isDocumentModalOpen}
          onClose={() => setIsDocumentModalOpen(false)}
          docId={null}
          defaultCaseId={id}
        />
      )}

      {isEditCaseModalOpen && (
        <CaseForm 
          isOpen={isEditCaseModalOpen}
          onClose={() => setIsEditCaseModalOpen(false)}
          caseId={id}
        />
      )}

      {isInvoiceModalOpen && (
        <InvoiceForm
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoiceId={null}
          defaultCaseId={id}
        />
      )}
    </div>
  );
};

export default CaseDetail;