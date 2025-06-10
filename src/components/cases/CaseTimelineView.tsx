import React, { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  User, 
  Scale, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { StatusCard } from '../ui';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'case' | 'hearing' | 'document' | 'invoice' | 'contact';
  title: string;
  description: string;
  status?: 'completed' | 'active' | 'pending' | 'overdue';
  icon: React.ReactNode;
  metadata?: Array<{ label: string; value: string }>;
  relatedEntity?: {
    type: string;
    id: string;
  };
}

interface CaseTimelineViewProps {
  caseId: string;
  className?: string;
}

/**
 * CaseTimelineView - Visual timeline of all case-related events
 * Shows chronological progression of hearings, documents, invoices, and status changes
 */
export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({ caseId, className = '' }) => {
  const { state } = useData();
  const navigate = useNavigate();
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'hearing' | 'document' | 'invoice' | 'case'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get case data
  const caseData = state.cases.find(c => c.caseId === caseId);
  const caseHearings = state.hearings.filter(h => h.caseId === caseId);
  const caseDocuments = state.documents.filter(d => d.caseId === caseId);
  const caseInvoices = state.invoices.filter(i => i.caseId === caseId);
  
  // Get audit logs for status changes
  const caseAuditLogs = state.auditLogs.filter(
    log => log.entityId === caseId && log.entityType === 'Case'
  );

  // Build timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add case creation event
    if (caseData) {
      events.push({
        id: `case-created-${caseData.caseId}`,
        date: new Date(caseData.createdAt),
        type: 'case',
        title: 'Case Created',
        description: `${caseData.plaintiff} v. ${caseData.defendant}`,
        status: 'completed',
        icon: <Scale className="w-5 h-5" />,
        metadata: [
          { label: 'Case ID', value: caseData.caseId },
          { label: 'Address', value: caseData.address || 'Not specified' }
        ]
      });

      // Add intake date if different from creation
      if (caseData.intakeDate) {
        const intakeDate = typeof caseData.intakeDate === 'string' 
          ? parseISO(caseData.intakeDate) 
          : caseData.intakeDate;
        
        if (isValid(intakeDate)) {
          events.push({
            id: `case-intake-${caseData.caseId}`,
            date: intakeDate,
            type: 'case',
            title: 'Case Intake',
            description: 'Initial case intake completed',
            status: 'completed',
            icon: <User className="w-5 h-5" />
          });
        }
      }
    }

    // Add hearings
    caseHearings.forEach(hearing => {
      const hearingDate = typeof hearing.hearingDate === 'string'
        ? parseISO(hearing.hearingDate)
        : hearing.hearingDate;
      
      if (isValid(hearingDate)) {
        const isPast = hearingDate < new Date();
        const isToday = format(hearingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        
        events.push({
          id: `hearing-${hearing.hearingId}`,
          date: hearingDate,
          type: 'hearing',
          title: `Hearing${hearing.outcome ? ' - ' + hearing.outcome : ''}`,
          description: hearing.courtName || 'Court hearing scheduled',
          status: isPast ? 'completed' : isToday ? 'active' : 'pending',
          icon: <Calendar className="w-5 h-5" />,
          metadata: [
            { label: 'Time', value: format(hearingDate, 'h:mm a') },
            { label: 'Court', value: hearing.courtName || 'TBD' },
            ...(hearing.outcome ? [{ label: 'Outcome', value: hearing.outcome }] : [])
          ],
          relatedEntity: {
            type: 'hearing',
            id: hearing.hearingId
          }
        });
      }
    });

    // Add documents
    caseDocuments.forEach(doc => {
      const docDate = typeof doc.createdAt === 'string'
        ? parseISO(doc.createdAt)
        : doc.createdAt;
      
      if (isValid(docDate)) {
        events.push({
          id: `document-${doc.docId}`,
          date: docDate,
          type: 'document',
          title: `${doc.type} Filed`,
          description: doc.notes || `Document type: ${doc.type}`,
          status: doc.status === 'Served' ? 'completed' : doc.status === 'Pending' ? 'pending' : 'active',
          icon: <FileText className="w-5 h-5" />,
          metadata: [
            { label: 'Type', value: doc.type },
            { label: 'Status', value: doc.status }
          ],
          relatedEntity: {
            type: 'document',
            id: doc.docId
          }
        });
      }
    });

    // Add invoices
    caseInvoices.forEach(invoice => {
      const invoiceDate = typeof invoice.issueDate === 'string'
        ? parseISO(invoice.issueDate)
        : invoice.issueDate;
      
      if (isValid(invoiceDate)) {
        events.push({
          id: `invoice-${invoice.invoiceId}`,
          date: invoiceDate,
          type: 'invoice',
          title: `Invoice #${invoice.invoiceId}`,
          description: `Amount: $${invoice.amount.toFixed(2)}`,
          status: invoice.paid ? 'completed' : 'pending',
          icon: <DollarSign className="w-5 h-5" />,
          metadata: [
            { label: 'Amount', value: `$${invoice.amount.toFixed(2)}` },
            { label: 'Status', value: invoice.paid ? 'Paid' : 'Unpaid' },
            ...(invoice.dueDate ? [{ label: 'Due Date', value: format(parseISO(invoice.dueDate), 'MMM d, yyyy') }] : [])
          ],
          relatedEntity: {
            type: 'invoice',
            id: invoice.invoiceId
          }
        });
      }
    });

    // Add status changes from audit logs
    caseAuditLogs.forEach(log => {
      if (log.action === 'Update' && log.metadata?.changes?.status) {
        const logDate = typeof log.timestamp === 'string'
          ? parseISO(log.timestamp)
          : log.timestamp;
        
        if (isValid(logDate)) {
          events.push({
            id: `status-change-${log.id}`,
            date: logDate,
            type: 'case',
            title: 'Status Changed',
            description: `Status updated to: ${log.metadata.changes.status.new}`,
            status: 'completed',
            icon: <AlertCircle className="w-5 h-5" />,
            metadata: [
              { label: 'From', value: log.metadata.changes.status.old || 'Unknown' },
              { label: 'To', value: log.metadata.changes.status.new }
            ]
          });
        }
      }
    });

    // Filter events
    const filteredEvents = filterType === 'all' 
      ? events 
      : events.filter(event => event.type === filterType);

    // Sort events
    return filteredEvents.sort((a, b) => {
      const diff = a.date.getTime() - b.date.getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [caseData, caseHearings, caseDocuments, caseInvoices, caseAuditLogs, filterType, sortOrder]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleEventClick = (event: TimelineEvent) => {
    if (event.relatedEntity) {
      switch (event.relatedEntity.type) {
        case 'hearing':
          // Navigate to hearings tab in case detail
          navigate(`/cases/${caseId}?tab=hearings`);
          break;
        case 'document':
          // Navigate to documents tab in case detail
          navigate(`/cases/${caseId}?tab=documents`);
          break;
        case 'invoice':
          // Navigate to invoices tab in case detail
          navigate(`/cases/${caseId}?tab=invoices`);
          break;
        default:
          break;
      }
    }
  };

  const getEventStatus = (event: TimelineEvent): 'active' | 'pending' | 'completed' | 'overdue' | 'draft' => {
    if (event.status) {
      switch (event.status) {
        case 'completed': return 'completed';
        case 'active': return 'active';
        case 'pending': return 'pending';
        case 'overdue': return 'overdue';
        default: return 'draft';
      }
    }
    return 'draft';
  };

  const filterOptions = [
    { value: 'all', label: 'All Events', icon: <Filter className="w-4 h-4" /> },
    { value: 'hearing', label: 'Hearings', icon: <Calendar className="w-4 h-4" /> },
    { value: 'document', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { value: 'invoice', label: 'Invoices', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'case', label: 'Case Events', icon: <Scale className="w-4 h-4" /> }
  ];

  if (!caseData) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>No case data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timeline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Filter:</span>
          <div className="flex gap-1">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value as any)}
                className={`
                  inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors
                  ${filterType === option.value 
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                  }
                `}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          icon={<Clock className="w-4 h-4" />}
        >
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>

      {/* Timeline Events */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
        
        {/* Events */}
        <div className="space-y-4">
          {timelineEvents.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No timeline events to display</p>
            </div>
          ) : (
            timelineEvents.map((event, index) => {
              const isExpanded = expandedEvents.has(event.id);
              const isLast = index === timelineEvents.length - 1;
              
              return (
                <div key={event.id} className="relative">
                  {/* Timeline dot */}
                  <div className={`
                    absolute left-4 w-4 h-4 rounded-full border-2 bg-white
                    ${event.status === 'completed' ? 'border-green-500' : 
                      event.status === 'active' ? 'border-blue-500' :
                      event.status === 'pending' ? 'border-yellow-500' :
                      event.status === 'overdue' ? 'border-red-500' :
                      'border-neutral-400'}
                  `}></div>
                  
                  {/* Event card */}
                  <div className="ml-12">
                    <StatusCard
                      title={event.title}
                      status={getEventStatus(event)}
                      subtitle={format(event.date, 'MMM d, yyyy • h:mm a')}
                      description={!isExpanded ? event.description : undefined}
                      icon={undefined}
                      metadata={isExpanded ? event.metadata : undefined}
                      actions={[
                        ...(event.metadata && event.metadata.length > 0 ? [{
                          label: isExpanded ? 'Show Less' : 'Show More',
                          onClick: () => toggleEventExpansion(event.id),
                          variant: 'outline' as const
                        }] : []),
                        ...(event.relatedEntity ? [{
                          label: 'View Details',
                          onClick: () => handleEventClick(event),
                          variant: 'outline' as const
                        }] : [])
                      ].filter(Boolean).length > 0 ? [
                        ...(event.metadata && event.metadata.length > 0 ? [{
                          label: isExpanded ? 'Show Less' : 'Show More',
                          onClick: () => toggleEventExpansion(event.id),
                          variant: 'outline' as const
                        }] : []),
                        ...(event.relatedEntity ? [{
                          label: 'View Details',
                          onClick: () => handleEventClick(event),
                          variant: 'outline' as const
                        }] : [])
                      ] : undefined}
                      className={`
                        transition-all duration-200
                        ${isLast ? '' : 'mb-4'}
                        ${event.relatedEntity ? 'cursor-pointer hover:shadow-md' : ''}
                      `}
                      onClick={event.relatedEntity ? () => handleEventClick(event) : undefined}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-neutral-900">{timelineEvents.length}</p>
            <p className="text-sm text-neutral-600">Total Events</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-green-600">
              {timelineEvents.filter(e => e.status === 'completed').length}
            </p>
            <p className="text-sm text-neutral-600">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-yellow-600">
              {timelineEvents.filter(e => e.status === 'pending').length}
            </p>
            <p className="text-sm text-neutral-600">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-blue-600">
              {timelineEvents.filter(e => e.status === 'active').length}
            </p>
            <p className="text-sm text-neutral-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseTimelineView;