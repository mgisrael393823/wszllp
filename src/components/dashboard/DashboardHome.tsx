import React from 'react';
import Card from '../ui/Card';
import { Briefcase, Calendar, FileText, CreditCard, TrendingUp } from 'lucide-react';

const DashboardHome: React.FC = () => {
  // Placeholder data
  const stats = {
    totalCases: 124,
    openCases: 87,
    closedCases: 37,
    upcomingHearings: 12,
    pendingDocuments: 43,
    recentDocuments: 156,
    unpaidInvoices: 28,
    totalUnpaid: 32650.75
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Overview of your eviction practice</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Cases</p>
              <p className="text-2xl font-semibold mt-1">{stats.totalCases}</p>
            </div>
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

      {/* Upcoming Hearings & Recent Documents Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Hearings">
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      Smith Property v. Tenant {i + 1}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Cook County Circuit Court</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-600">
                      May {10 + i}, 2023
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      9:00 AM
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <a href="#" className="text-primary-600 text-sm font-medium hover:text-primary-800">
              View all hearings →
            </a>
          </div>
        </Card>

        <Card title="Recent Documents">
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      {['Complaint', 'Summons', 'Affidavit', 'Motion', 'Order'][i]}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Case #{1000 + i} - Jones Property
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium
                      ${i % 3 === 0 ? 'bg-yellow-100 text-yellow-800' : 
                        i % 3 === 1 ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`
                    }>
                      {i % 3 === 0 ? 'Pending' : i % 3 === 1 ? 'Served' : 'Filed'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      May {5 + i}, 2023
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <a href="#" className="text-primary-600 text-sm font-medium hover:text-primary-800">
              View all documents →
            </a>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Eviction Success Metrics</h2>
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