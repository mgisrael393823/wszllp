import React from 'react';
import { MetricCard } from './MetricCard';
import { StatusCard } from './StatusCard';
import { ActionListCard } from './ActionListCard';
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

/**
 * Showcase page for testing all new card components
 * Navigate to /card-showcase to view
 */
export const CardShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">
          New Card Components Showcase
        </h1>
        
        {/* MetricCard Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            MetricCard Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Cases"
              value="42"
              icon={FileText}
              trend={{ value: "+12%", isPositive: true }}
              subtitle="vs. last month"
              onClick={() => console.log('Navigate to active cases')}
            />
            <MetricCard
              title="Pending Hearings"
              value="8"
              icon={Calendar}
              trend={{ value: "-3", isPositive: false }}
              subtitle="this week"
              onClick={() => console.log('Navigate to hearings')}
            />
            <MetricCard
              title="Total Clients"
              value="156"
              icon={Users}
              trend={{ value: "+5%", isPositive: true }}
              onClick={() => console.log('Navigate to clients')}
            />
            <MetricCard
              title="Revenue"
              value="$45,231"
              icon={DollarSign}
              subtitle="Year to date"
            />
          </div>
        </section>

        {/* StatusCard Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            StatusCard Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatusCard
              title="Case #2024-001"
              status="active"
              icon={FileText}
              subtitle="Smith vs. Johnson"
              description="Eviction case pending hearing on March 15, 2024"
              metadata={[
                { label: "Filed", value: "Jan 15, 2024" },
                { label: "Next Action", value: "Hearing" },
                { label: "Attorney", value: "John Doe" },
                { label: "Court", value: "District Court" }
              ]}
              actions={[
                { label: "View Details", onClick: () => console.log('View'), variant: "primary" },
                { label: "Add Note", onClick: () => console.log('Add note') }
              ]}
            />
            <StatusCard
              title="Motion to Dismiss"
              status="pending"
              icon={AlertCircle}
              subtitle="Case #2024-002"
              description="Awaiting judge's decision"
              metadata={[
                { label: "Filed", value: "Feb 28, 2024" },
                { label: "Response Due", value: "Mar 10, 2024" }
              ]}
              actions={[
                { label: "View Motion", onClick: () => console.log('View motion') }
              ]}
            />
            <StatusCard
              title="Settlement Agreement"
              status="completed"
              icon={CheckCircle}
              subtitle="Case #2023-156"
              description="Settlement reached and case closed"
              metadata={[
                { label: "Closed", value: "Dec 20, 2023" },
                { label: "Amount", value: "$25,000" }
              ]}
              actions={[
                { label: "Download", onClick: () => console.log('Download') },
                { label: "Archive", onClick: () => console.log('Archive'), variant: "outline" }
              ]}
            />
            <StatusCard
              title="Rent Payment"
              status="overdue"
              icon={DollarSign}
              subtitle="Invoice #INV-2024-045"
              description="Payment was due 5 days ago"
              metadata={[
                { label: "Amount", value: "$2,500" },
                { label: "Due Date", value: "Mar 1, 2024" }
              ]}
              actions={[
                { label: "Send Reminder", onClick: () => console.log('Send'), variant: "primary" }
              ]}
            />
            <StatusCard
              title="Lease Agreement"
              status="draft"
              icon={FileText}
              subtitle="New tenant documentation"
              description="Pending client review and signature"
              metadata={[
                { label: "Created", value: "Mar 5, 2024" },
                { label: "Property", value: "123 Main St" }
              ]}
              actions={[
                { label: "Edit Draft", onClick: () => console.log('Edit') },
                { label: "Preview", onClick: () => console.log('Preview'), variant: "outline" }
              ]}
            />
          </div>
        </section>

        {/* ActionListCard Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            ActionListCard Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionListCard
              title="Recent Cases"
              description="Your most recently accessed cases"
              items={[
                {
                  id: '1',
                  icon: FileText,
                  title: 'Smith vs. Johnson',
                  subtitle: 'Case #2024-001',
                  value: '2 days ago',
                  onClick: () => console.log('Navigate to case 1')
                },
                {
                  id: '2',
                  icon: FileText,
                  title: 'Davis Property Eviction',
                  subtitle: 'Case #2024-002',
                  value: '5 days ago',
                  badge: { text: 'Urgent', variant: 'warning' },
                  onClick: () => console.log('Navigate to case 2')
                },
                {
                  id: '3',
                  icon: FileText,
                  title: 'Thompson Lease Dispute',
                  subtitle: 'Case #2024-003',
                  value: '1 week ago',
                  onClick: () => console.log('Navigate to case 3')
                }
              ]}
            />
            <ActionListCard
              title="Quick Actions"
              items={[
                {
                  id: 'new-case',
                  icon: FileText,
                  title: 'Create New Case',
                  onClick: () => console.log('Create case')
                },
                {
                  id: 'new-client',
                  icon: Users,
                  title: 'Add New Client',
                  onClick: () => console.log('Add client')
                },
                {
                  id: 'schedule-hearing',
                  icon: Calendar,
                  title: 'Schedule Hearing',
                  onClick: () => console.log('Schedule hearing')
                },
                {
                  id: 'generate-invoice',
                  icon: DollarSign,
                  title: 'Generate Invoice',
                  onClick: () => console.log('Generate invoice')
                }
              ]}
            />
            <ActionListCard
              title="Upcoming Deadlines"
              items={[
                {
                  id: 'd1',
                  icon: Clock,
                  title: 'Motion Response Due',
                  subtitle: 'Case #2024-002',
                  value: 'Tomorrow',
                  badge: { text: 'Critical', variant: 'error' },
                  onClick: () => console.log('View deadline 1')
                },
                {
                  id: 'd2',
                  icon: Clock,
                  title: 'Discovery Deadline',
                  subtitle: 'Case #2024-003',
                  value: 'Mar 15',
                  badge: { text: 'Important', variant: 'warning' },
                  onClick: () => console.log('View deadline 2')
                },
                {
                  id: 'd3',
                  icon: Clock,
                  title: 'Filing Deadline',
                  subtitle: 'Case #2024-004',
                  value: 'Mar 20',
                  onClick: () => console.log('View deadline 3')
                }
              ]}
              showDividers={true}
            />
          </div>
        </section>

        {/* Mixed Layout Example */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">
            Dashboard Layout Example
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Metrics */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <MetricCard
                  title="Active Cases"
                  value="42"
                  icon={FileText}
                  trend={{ value: "+12%", isPositive: true }}
                  subtitle="vs. last month"
                />
                <MetricCard
                  title="Revenue This Month"
                  value="$12,450"
                  icon={DollarSign}
                  trend={{ value: "+8%", isPositive: true }}
                />
              </div>
              <StatusCard
                title="Latest Case Activity"
                status="active"
                icon={FileText}
                subtitle="Johnson vs. State - Motion Filed"
                description="A motion to dismiss has been filed by the defendant. Response due by March 15, 2024."
                metadata={[
                  { label: "Case #", value: "2024-045" },
                  { label: "Filed", value: "Today at 2:45 PM" }
                ]}
                actions={[
                  { label: "Review Motion", onClick: () => {}, variant: "primary" },
                  { label: "Set Reminder", onClick: () => {} }
                ]}
              />
            </div>
            {/* Right column - Action list */}
            <div>
              <ActionListCard
                title="Upcoming Tasks"
                items={[
                  {
                    id: 't1',
                    icon: AlertCircle,
                    title: 'Review Settlement Offer',
                    subtitle: 'Due today',
                    badge: { text: 'High', variant: 'error' }
                  },
                  {
                    id: 't2',
                    icon: Calendar,
                    title: 'Client Meeting',
                    subtitle: '3:00 PM',
                    badge: { text: 'Today', variant: 'warning' }
                  },
                  {
                    id: 't3',
                    icon: FileText,
                    title: 'File Response Brief',
                    subtitle: 'Due tomorrow'
                  }
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardShowcase;