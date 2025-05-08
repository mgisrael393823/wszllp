import React from 'react';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';
import { Briefcase, Calendar, FileText, CreditCard } from 'lucide-react';
import Card from '../ui/Card';

const DashboardHome: React.FC = () => {
  const { state } = useData();

  // Calculate statistics

  // Calculate case statistics
  const totalCases = state.cases.length;
  const activeCases = state.cases.filter(c => c.status === 'Active').length;
  const intakeCases = state.cases.filter(c => c.status === 'Intake').length;
  const closedCases = state.cases.filter(c => c.status === 'Closed').length;

  // Get upcoming hearings (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const upcomingHearings = state.hearings
    .filter(hearing => {
      const hearingDate = new Date(hearing.hearingDate);
      return hearingDate >= today && hearingDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());

  // Recent documents
  const recentDocuments = [...state.documents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Unpaid invoices
  const unpaidInvoices = state.invoices.filter(invoice => !invoice.paid);
  const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of case management statistics and activities
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Cases</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">{totalCases}</p>
            </div>
            <div className="rounded-full bg-primary-200 p-3">
              <Briefcase size={20} className="text-primary-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-primary-700">
            <span className="font-medium">{activeCases} Active</span>
            <span className="mx-1">•</span>
            <span>{intakeCases} Intake</span>
            <span className="mx-1">•</span>
            <span>{closedCases} Closed</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-secondary-600 text-sm font-medium">Upcoming Hearings</p>
              <p className="text-3xl font-bold text-secondary-900 mt-1">{upcomingHearings.length}</p>
            </div>
            <div className="rounded-full bg-secondary-200 p-3">
              <Calendar size={20} className="text-secondary-700" />
            </div>
          </div>
          <div className="mt-4 text-xs text-secondary-700">
            <span className="font-medium">Next 7 days</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-accent-600 text-sm font-medium">Documents</p>
              <p className="text-3xl font-bold text-accent-900 mt-1">{state.documents.length}</p>
            </div>
            <div className="rounded-full bg-accent-200 p-3">
              <FileText size={20} className="text-accent-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-accent-700">
            <span className="font-medium">
              {state.documents.filter(d => d.status === 'Pending').length} Pending
            </span>
            <span className="mx-1">•</span>
            <span>
              {state.documents.filter(d => d.status === 'Served').length} Served
            </span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-error-50 to-error-100 border-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-error-600 text-sm font-medium">Unpaid Invoices</p>
              <p className="text-3xl font-bold text-error-900 mt-1">${totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="rounded-full bg-error-200 p-3">
              <CreditCard size={20} className="text-error-700" />
            </div>
          </div>
          <div className="mt-4 text-xs text-error-700">
            <span className="font-medium">{unpaidInvoices.length} outstanding invoices</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Hearings */}
        <Card title="Upcoming Hearings">
          {upcomingHearings.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {upcomingHearings.slice(0, 5).map(hearing => {
                const associatedCase = state.cases.find(c => c.caseId === hearing.caseId);
                return (
                  <div key={hearing.hearingId} className="py-3 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {associatedCase ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` : 'Unknown Case'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{hearing.courtName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary-600">
                          {format(new Date(hearing.hearingDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(hearing.hearingDate), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">No upcoming hearings</p>
          )}
        </Card>

        {/* Recent Documents */}
        <Card title="Recent Documents">
          {recentDocuments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentDocuments.map(doc => {
                const associatedCase = state.cases.find(c => c.caseId === doc.caseId);
                return (
                  <div key={doc.docId} className="py-3 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {doc.type}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {associatedCase ? `${associatedCase.plaintiff} v. ${associatedCase.defendant}` : 'Unknown Case'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium
                          ${doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            doc.status === 'Served' ? 'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'}`
                        }>
                          {doc.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">No documents added yet</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;