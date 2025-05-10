import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { format, isAfter, addDays, parseISO } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { 
  Briefcase, Calendar, FileText, CreditCard, 
  TrendingUp, ArrowRight, Clock, AlertCircle 
} from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { state } = useData();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCases: 0,
    openCases: 0,
    closedCases: 0,
    upcomingHearings: 0,
    pendingDocuments: 0,
    recentDocuments: 0,
    unpaidInvoices: 0,
    totalUnpaid: 0
  });
  
  // Calculate statistics from actual data
  useEffect(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    // Case statistics
    const totalCases = state.cases.length;
    const openCases = state.cases.filter(c => c.status !== 'Closed').length;
    const closedCases = state.cases.filter(c => c.status === 'Closed').length;
    
    // Hearing statistics
    const upcomingHearings = state.hearings.filter(h => {
      const hearingDate = parseISO(h.hearingDate);
      return isAfter(hearingDate, now) && !isAfter(hearingDate, nextWeek);
    }).length;
    
    // Document statistics
    const pendingDocuments = state.documents.filter(d => d.status === 'Pending').length;
    const recentDocuments = state.documents.length;
    
    // Invoice statistics
    const unpaidInvoices = state.invoices.filter(i => !i.paid).length;
    const totalUnpaid = state.invoices
      .filter(i => !i.paid)
      .reduce((total, invoice) => total + invoice.amount, 0);
      
    setStats({
      totalCases,
      openCases,
      closedCases,
      upcomingHearings,
      pendingDocuments,
      recentDocuments,
      unpaidInvoices,
      totalUnpaid
    });
  }, [state]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Overview of your eviction practice</p>
      </div>

      {/* Stats Cards - using 24px (gap-6) spacing between cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Cases</p>
              <p className="text-2xl font-semibold mt-1">{stats.totalCases}</p>
            </div>
            {/* Icon container with 12px padding */}
            <div className="rounded-full bg-primary-100 p-3">
              <Briefcase size={20} className="text-primary-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="font-medium text-green-600">{stats.openCases} Open</span>
            <span className="mx-1">•</span>
            <span className="text-gray-600">{stats.closedCases} Closed</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Upcoming Hearings</p>
              <p className="text-2xl font-semibold mt-1">{stats.upcomingHearings}</p>
            </div>
            <div className="rounded-full bg-secondary-100 p-3">
              <Calendar size={20} className="text-secondary-700" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="font-medium">Next 7 days</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Documents</p>
              <p className="text-2xl font-semibold mt-1">{stats.recentDocuments}</p>
            </div>
            <div className="rounded-full bg-accent-100 p-3">
              <FileText size={20} className="text-accent-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="font-medium text-yellow-600">
              {stats.pendingDocuments} Pending
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Unpaid Invoices</p>
              <p className="text-2xl font-semibold mt-1">${stats.totalUnpaid.toLocaleString()}</p>
            </div>
            <div className="rounded-full bg-error-100 p-3">
              <CreditCard size={20} className="text-error-700" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="font-medium">{stats.unpaidInvoices} outstanding invoices</span>
          </div>
        </Card>
      </div>

      {/* Case Trend Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Case Trend (Last 30 days)</h2>
          <div className="flex items-center text-green-600 text-sm font-medium">
            <TrendingUp size={16} className="mr-1" />
            <span>+12% from last month</span>
          </div>
        </div>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Case trend chart will appear here</p>
        </div>
      </Card>

      {/* Upcoming Hearings & Recent Documents Tables - using 24px (gap-6) spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Hearings">
          <div className="divide-y divide-gray-200">
            {state.hearings
              .filter(h => new Date(h.hearingDate) > new Date())
              .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
              .slice(0, 5)
              .map((hearing) => {
                const relatedCase = state.cases.find(c => c.caseId === hearing.caseId);
                return (
                  <div key={hearing.hearingId} className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {relatedCase 
                            ? `${relatedCase.plaintiff} v. ${relatedCase.defendant}` 
                            : 'Unknown Case'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{hearing.courtName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary-600">
                          {format(new Date(hearing.hearingDate), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(hearing.hearingDate), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            {state.hearings.filter(h => new Date(h.hearingDate) > new Date()).length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No upcoming hearings scheduled.
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <Button
              variant="text"
              size="sm"
              onClick={() => navigate('/hearings')}
              rightIcon={<ArrowRight size={16} />}
            >
              View all hearings
            </Button>
          </div>
        </Card>

        <Card title="Recent Documents">
          <div className="divide-y divide-gray-200">
            {state.documents
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((document) => {
                const relatedCase = state.cases.find(c => c.caseId === document.caseId);
                return (
                  <div key={document.docId} className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {document.type}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {relatedCase
                            ? `${relatedCase.plaintiff} v. ${relatedCase.defendant}`
                            : 'Unknown Case'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium
                          ${document.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            document.status === 'Served' ? 'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'}`
                        }>
                          {document.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(document.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            {state.documents.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No documents found. Add documents to your cases.
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <Button
              variant="text"
              size="sm"
              onClick={() => navigate('/documents')}
              rightIcon={<ArrowRight size={16} />}
            >
              View all documents
            </Button>
          </div>
        </Card>
      </div>

      {/* Performance Metrics - with 24px padding */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Eviction Success Metrics</h2>
        {/* Metrics grid with 24px spacing between items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">Average Time to Eviction</p>
            <p className="text-2xl font-bold text-primary-700">42 days</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">Settlement Rate</p>
            <p className="text-2xl font-bold text-primary-700">38%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">Judgment Success Rate</p>
            <p className="text-2xl font-bold text-primary-700">92%</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardHome;