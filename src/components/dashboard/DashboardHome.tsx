import React, { useMemo } from 'react';
import { 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Briefcase,
  Scale
} from 'lucide-react';
import Card, { type MetricData, type ActionItem, type ActivityItem } from '../ui/Card';
import { useData } from '../../context/DataContext';


/**
 * Executive Dashboard Home component with sophisticated metrics and insights
 */
const DashboardHome: React.FC = () => {
  const { state } = useData();
  
  // Prepare metric data for Card variants
  const kpiData = useMemo(() => {
    const totalCases = state.cases.length;
    const activeCases = state.cases.filter(c => c.status === 'Active').length;
    const upcomingHearings = state.hearings.filter(h => 
      new Date(h.hearingDate) > new Date() && 
      new Date(h.hearingDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    const pendingDocuments = state.documents.filter(d => d.status === 'Pending').length;
    const totalDocuments = state.documents.length;
    const recentNotifications = state.notifications.filter(n => !n.isRead).length;

    const totalCasesData: MetricData = {
      value: totalCases,
      progress: { current: activeCases, max: totalCases, variant: 'primary' },
      subtitle: `${activeCases} active cases`
    };

    const upcomingHearingsData: MetricData = {
      value: upcomingHearings,
      trend: { 
        icon: <TrendingUp />, 
        label: 'Next 30 days', 
        color: 'text-success-600' 
      },
      subtitle: 'Schedule management'
    };

    const documentsData: MetricData = {
      value: totalDocuments,
      progress: { 
        current: totalDocuments - pendingDocuments, 
        max: totalDocuments, 
        variant: pendingDocuments > 0 ? 'warning' : 'success' 
      },
      subtitle: `${pendingDocuments} pending review`
    };

    const activityData: MetricData = {
      value: state.auditLogs.length,
      trend: { 
        icon: <Clock />, 
        label: 'Total actions', 
        color: 'text-accent-600' 
      },
      subtitle: `${recentNotifications} unread notifications`
    };

    return {
      totalCases: totalCasesData,
      upcomingHearings: upcomingHearingsData,
      documents: documentsData,
      activity: activityData,
      documentsBadge: pendingDocuments > 0 ? (
        <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 rounded-full text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          {pendingDocuments}
        </div>
      ) : (
        <CheckCircle2 className="w-5 h-5 text-success-600" />
      ),
      activityBadge: recentNotifications > 0 ? (
        <div className="flex items-center gap-1 px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
          {recentNotifications} new
        </div>
      ) : undefined
    };
  }, [state]);

  // Prepare quick actions data - no manual icon sizing
  const quickActions: ActionItem[] = useMemo(() => [
    {
      icon: <Briefcase />,
      label: 'New Case',
      onClick: () => console.log('Navigate to new case'),
      variant: 'primary'
    },
    {
      icon: <Calendar />,
      label: 'Schedule Hearing',
      onClick: () => console.log('Navigate to schedule hearing'),
      variant: 'success'
    },
    {
      icon: <FileText />,
      label: 'Upload Document',
      onClick: () => console.log('Navigate to upload document'),
      variant: 'accent'
    },
    {
      icon: <Users />,
      label: 'Add Contact',
      onClick: () => console.log('Navigate to add contact'),
      variant: 'secondary'
    }
  ], []);

  // Prepare activity feed data
  const activities: ActivityItem[] = useMemo(() => {
    return state.auditLogs
      .slice(-7)
      .reverse()
      .map(log => {
        const timeAgo = new Date(log.timestamp).toLocaleDateString();
        
        const getActivityIcon = (entityType: string) => {
          switch (entityType) {
            case 'Case': return <Briefcase />;
            case 'Hearing': return <Calendar />;
            case 'Document': return <FileText />;
            case 'Contact': return <Users />;
            default: return <Activity />;
          }
        };
        
        const getVariant = (action: string): 'default' | 'success' | 'warning' | 'error' => {
          switch (action) {
            case 'Create': return 'success';
            case 'Update': return 'default';
            case 'Delete': return 'error';
            case 'Complete': return 'success';
            default: return 'default';
          }
        };
        
        return {
          id: log.id,
          icon: getActivityIcon(log.entityType),
          title: `${log.action} ${log.entityType}`,
          description: log.details,
          timestamp: timeAgo,
          variant: getVariant(log.action),
          onClick: () => console.log('Navigate to:', log)
        };
      });
  }, [state.auditLogs]);
  
  return (
    <div className="page-container">
      {/* Clean Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Scale className="w-8 h-8 text-primary-600" />
          Executive Dashboard
        </h1>
        <p className="page-subtitle">
          Comprehensive overview of your legal practice performance and key metrics
        </p>
      </div>
      
      {/* KPI Metrics Grid - Using Card variant system */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        <Card 
          variant="metric"
          elevation="medium"
          interactive
          icon={<Briefcase className="w-5 h-5 text-primary-600" />}
          title="Total Cases"
          metricData={kpiData.totalCases}
        />

        <Card 
          variant="metric"
          elevation="medium"
          interactive
          icon={<Calendar className="w-5 h-5 text-success-600" />}
          title="Upcoming Hearings"
          metricData={kpiData.upcomingHearings}
        />

        <Card 
          variant="metric"
          elevation="medium"
          interactive
          icon={<FileText className="w-5 h-5 text-warning-600" />}
          title="Document Status"
          badge={kpiData.documentsBadge}
          metricData={kpiData.documents}
        />

        <Card 
          variant="metric"
          elevation="medium"
          interactive
          icon={<Activity className="w-5 h-5 text-accent-600" />}
          title="System Activity"
          badge={kpiData.activityBadge}
          metricData={kpiData.activity}
        />
      </div>

      {/* Secondary Content Grid - Using Card variant system */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <Card 
          variant="action-list"
          elevation="low"
          title="Quick Actions"
          icon={<ArrowRight className="w-5 h-5" />}
          actions={quickActions}
          className="lg:col-span-1"
        />

        <Card 
          variant="activity-feed"
          elevation="low"
          title="Recent Activity"
          subtitle="Click any item to view details"
          icon={<Activity className="w-5 h-5" />}
          activities={activities}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
};

export default DashboardHome;