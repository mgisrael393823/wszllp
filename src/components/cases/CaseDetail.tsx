import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { format, parseISO, isValid } from 'date-fns';
import { 
  ArrowLeft, Plus, Calendar, FileText, Edit, 
  Clock, AlertCircle, User, CreditCard, Download,
  MapPin, Activity, MoreVertical, Printer, CalendarDays
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import HearingForm from '../hearings/HearingForm';
import DocumentForm from '../documents/DocumentForm';
import Modal from '../ui/Modal';
import CaseForm from './CaseForm';
import Pagination from '../ui/Pagination';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useData();
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isEditCaseModalOpen, setIsEditCaseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hearings' | 'documents' | 'invoices' | 'activity'>('hearings');
  const [currentPage, setCurrentPage] = useState(1);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const itemsPerPage = 5;

  const caseData = state.cases.find(c => c.caseId === id);
  const caseHearings = state.hearings.filter(h => h.caseId === id);
  const caseDocuments = state.documents.filter(d => d.caseId === id);
  const caseInvoices = state.invoices.filter(i => i.caseId === id);
  
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
      case 'hearings':
        return caseHearings;
      case 'documents':
        return caseDocuments;
      case 'invoices':
        return caseInvoices;
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
        <h2 className="text-2xl font-bold text-gray-900">Case not found</h2>
        <p className="mt-2 text-gray-600">The requested case could not be found.</p>
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
    (new Date().getTime() - new Date(caseData.intakeDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Table configurations for different tabs
  const hearingColumns = [
    {
      header: 'Court',
      accessor: 'courtName',
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (item: typeof state.hearings[0]) => {
        const date = typeof item.hearingDate === 'string'
          ? parseISO(item.hearingDate)
          : item.hearingDate instanceof Date
          ? item.hearingDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
      sortable: true,
    },
    {
      header: 'Time',
      accessor: (item: typeof state.hearings[0]) => {
        const date = typeof item.hearingDate === 'string'
          ? parseISO(item.hearingDate)
          : item.hearingDate instanceof Date
          ? item.hearingDate
          : null;
        return date && isValid(date)
          ? format(date, 'h:mm a')
          : 'Invalid Date';
      },
      sortable: false,
    },
    {
      header: 'Outcome',
      accessor: (item: typeof state.hearings[0]) => 
        item.outcome || 'Pending',
      sortable: false,
    },
  ];

  const documentColumns = [
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.documents[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
              item.status === 'Served' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`
          }
        >
          {item.status}
        </span>
      ),
      sortable: false,
    },
    {
      header: 'Created',
      accessor: (item: typeof state.documents[0]) => {
        const date = typeof item.createdAt === 'string'
          ? parseISO(item.createdAt)
          : item.createdAt instanceof Date
          ? item.createdAt
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (item: typeof state.documents[0]) => (
        <Button
          variant="text"
          size="sm"
          icon={<Download size={16} />}
          aria-label="Download document"
        />
      ),
    }
  ];

  const invoiceColumns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceId',
      sortable: true,
    },
    {
      header: 'Amount',
      accessor: (item: typeof state.invoices[0]) => 
        `$${item.amount.toFixed(2)}`,
      sortable: true,
    },
    {
      header: 'Issue Date',
      accessor: (item: typeof state.invoices[0]) => {
        const date = typeof item.issueDate === 'string'
          ? parseISO(item.issueDate)
          : item.issueDate instanceof Date
          ? item.issueDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.invoices[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }
        >
          {item.paid ? 'Paid' : 'Unpaid'}
        </span>
      ),
      sortable: false,
    },
  ];

  const activityColumns = [
    {
      header: 'Time',
      accessor: (item: typeof state.auditLogs[0]) => {
        const date = typeof item.timestamp === 'string'
          ? parseISO(item.timestamp)
          : item.timestamp instanceof Date
          ? item.timestamp
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, h:mm a')
          : 'Invalid Date';
      },
      sortable: true,
    },
    {
      header: 'Activity',
      accessor: (item: typeof state.auditLogs[0]) => {
        const actionColors = {
          'Create': 'text-green-700',
          'Update': 'text-blue-700',
          'Delete': 'text-red-700'
        };
        return (
          <span className={actionColors[item.action] || ''}>
            {item.details}
          </span>
        );
      },
      sortable: false,
    },
    {
      header: 'Entity Type',
      accessor: 'entityType',
      sortable: true,
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
        // Add invoice functionality would be here
        break;
      default:
        break;
    }
  };

  // Function to determine if Add button should be shown
  const shouldShowAddButton = () => {
    return activeTab !== 'activity';
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-4">
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
              Case ID: {caseData.caseId} | Created {(() => {
                const date = typeof caseData.createdAt === 'string' 
                  ? parseISO(caseData.createdAt) 
                  : caseData.createdAt instanceof Date 
                  ? caseData.createdAt 
                  : null;
                return date && isValid(date) 
                  ? format(date, 'MMMM d, yyyy') 
                  : 'Unknown';
              })()}
            </p>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
            icon={<MoreVertical size={16} />}
          >
            Actions
          </Button>
          
          {isActionsMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setIsEditCaseModalOpen(true);
                    setIsActionsMenuOpen(false);
                  }}
                >
                  <Edit size={16} className="mr-2" />
                  Edit Case
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    navigate('/calendar');
                  }}
                >
                  <CalendarDays size={16} className="mr-2" />
                  View in Calendar
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    // Print functionality would be implemented here
                  }}
                >
                  <Printer size={16} className="mr-2" />
                  Print Case Details
                </button>
                {/* More actions could be added here */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg ${
        caseData.status === 'Active' ? 'bg-green-50 border border-green-200' :
        caseData.status === 'Intake' ? 'bg-blue-50 border border-blue-200' : 
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              caseData.status === 'Active' ? 'bg-green-100' :
              caseData.status === 'Intake' ? 'bg-blue-100' : 
              'bg-gray-100'
            }`}>
              <Activity size={20} className={
                caseData.status === 'Active' ? 'text-green-700' :
                caseData.status === 'Intake' ? 'text-blue-700' : 
                'text-gray-700'
              } />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Status: <span className="font-bold">{caseData.status}</span></p>
              <p className="text-xs text-gray-600">Case Age: {caseAge} days</p>
            </div>
          </div>

          {scheduledHearing && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary-100">
                <Calendar size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Next Hearing</p>
                <p className="text-xs text-primary-600">
                  {(() => {
                    const date = typeof scheduledHearing.hearingDate === 'string'
                      ? parseISO(scheduledHearing.hearingDate)
                      : scheduledHearing.hearingDate instanceof Date
                      ? scheduledHearing.hearingDate
                      : null;
                    return date && isValid(date)
                      ? `${format(date, 'MMMM d, yyyy')} at ${format(date, 'h:mm a')}`
                      : 'Invalid Date';
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Details Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Case Information</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <User size={14} />
                  Plaintiff
                </dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">{caseData.plaintiff}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <User size={14} />
                  Defendant
                </dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">{caseData.defendant}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <MapPin size={14} />
                  Property Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  Intake Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const date = typeof caseData.intakeDate === 'string'
                      ? parseISO(caseData.intakeDate)
                      : caseData.intakeDate instanceof Date
                      ? caseData.intakeDate
                      : null;
                    return date && isValid(date)
                      ? format(date, 'MMMM d, yyyy')
                      : 'Invalid Date';
                  })()}
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Case Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Calendar size={16} />
                  Upcoming Hearings
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-blue-900">
                  {upcomingHearings}
                </dd>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                  <FileText size={16} />
                  Pending Documents
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-yellow-900">
                  {pendingDocuments}
                </dd>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-green-900 flex items-center gap-2">
                  <FileText size={16} />
                  Total Documents
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-green-900">
                  {caseDocuments.length}
                </dd>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-purple-900 flex items-center gap-2">
                  <CreditCard size={16} />
                  Unpaid Amount
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-purple-900">
                  ${caseInvoices.filter(i => !i.paid).reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs and Content */}
      <Card>
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            {(['hearings', 'documents', 'invoices', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`
                  whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {getActiveTabData().length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
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
        
        <Table
          data={paginatedData}
          columns={getActiveTabColumns()}
          keyField={
            activeTab === 'hearings' ? 'hearingId' :
            activeTab === 'documents' ? 'docId' :
            activeTab === 'invoices' ? 'invoiceId' : 'id'
          }
          emptyMessage={getEmptyMessage()}
        />

        <Pagination
          totalItems={activeTabData.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

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
    </div>
  );
};

export default CaseDetail;