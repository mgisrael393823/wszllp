import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Briefcase,
  Scale,
  RefreshCw,
  BarChart3,
  Contact
} from 'lucide-react';
import Card, { type MetricData, type ActionItem, type ActivityItem } from '../ui/Card';
import { useData } from '../../context/DataContext';
import dashboardService, { type DashboardMetrics, type KPICard, type RecentActivity } from '../../services/dashboardService';

/**
 * Enhanced Executive Dashboard Home component with sophisticated metrics and insights
 * Now powered by Supabase materialized views for optimal performance
 */
const EnhancedDashboardHome: React.FC = () => {
  const { state } = useData();
  const navigate = useNavigate();
  const [, setMetrics] = useState<DashboardMetrics | null>(null);
  const [kpiCards, setKpiCards] = useState<KPICard[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadDashboardData();
    };
    
    loadData();
    
    // Set up real-time subscriptions
    const unsubscribe = dashboardService.subscribeToUpdates(() => {
      loadData();
    });
    
    // Set up auto-refresh every 60 seconds for MVP requirement
    const autoRefreshInterval = setInterval(() => {
      if (!isRefreshing) {
        loadData();
      }
    }, 60000); // 60 seconds
    
    return () => {
      unsubscribe();
      clearInterval(autoRefreshInterval);
    };
  }, [isRefreshing]);
  
  // Load dashboard data from service
  const loadDashboardData = async () => {
    try {
      setError(null);
      const [metricsData, activityData] = await Promise.all([
        dashboardService.getDashboardMetrics(),
        dashboardService.getRecentActivity(7)
      ]);
      
      setMetrics(metricsData);
      setKpiCards(dashboardService.generateKPICards(metricsData));
      setRecentActivity(activityData);
      setLastRefreshed(metricsData.lastRefreshed);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
      
      // Fallback to mock data from context if service fails
      setKpiCards(generateFallbackKPICards());
      setRecentActivity(generateFallbackActivity());
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dashboardService.refreshDashboardData();
      await loadDashboardData();
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fallback KPI cards using legacy data context
  const generateFallbackKPICards = (): KPICard[] => {
    const totalCases = state.cases.length;
    const activeCases = state.cases.filter(c => c.status === 'Active').length;
    const upcomingHearings = state.hearings.filter(h => 
      new Date(h.hearingDate) > new Date() && 
      new Date(h.hearingDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    const pendingDocuments = state.documents.filter(d => d.status === 'Pending').length;
    const totalDocuments = state.documents.length;
    const recentNotifications = state.notifications.filter(n => !n.isRead).length;
    
    return [
      {
        id: 'total-cases',
        title: 'Total Cases',
        value: totalCases,
        subtitle: `${activeCases} active cases`
      },
      {
        id: 'upcoming-hearings',
        title: 'Upcoming Hearings',
        value: upcomingHearings,
        subtitle: 'Next 30 days'
      },
      {
        id: 'document-status',
        title: 'Document Status',
        value: totalDocuments,
        subtitle: `${pendingDocuments} pending review`
      },
      {
        id: 'system-activity',
        title: 'System Activity',
        value: state.auditLogs.length,
        subtitle: `${recentNotifications} unread notifications`
      }
    ];
  };
  
  // Fallback activity using legacy data context
  const generateFallbackActivity = (): RecentActivity[] => {
    return state.auditLogs
      .slice(-7)
      .reverse()
      .map(log => ({
        id: log.id,
        title: `${log.action} ${log.entityType}`,
        description: log.details,
        timestamp: log.timestamp,
        entityType: log.entityType as RecentActivity['entityType'],
        entityId: log.entityId,
        action: log.action as RecentActivity['action']
      }));
  };
  
  // Navigation handlers for KPI cards
  const getKPINavigationHandler = (kpiId: string) => {
    const navigationMap: Record<string, string> = {
      'total-cases': '/cases',
      'upcoming-hearings': '/hearings',
      'document-status': '/documents',
      'system-activity': '/notifications', // Activity could link to notifications or a dedicated activity page
      'contacts': '/contacts',
      'case-efficiency': '/cases' // Could link to a reports page in the future
    };
    
    return () => {
      const targetPath = navigationMap[kpiId];
      if (targetPath) {
        navigate(targetPath);
      }
    };
  };

  // Convert KPI cards to MetricData for Card component compatibility
  const convertToMetricData = (kpi: KPICard): MetricData => {
    return {
      value: kpi.value,
      subtitle: kpi.subtitle || '',
      progress: kpi.progress,
      trend: kpi.trend ? {
        icon: kpi.trend.isPositive ? <TrendingUp size={16} /> : <TrendingUp size={16} className="rotate-180" />,
        label: kpi.trend.label,
        color: kpi.trend.isPositive ? 'text-success-600' : 'text-error-600'
      } : undefined
    };
  };

  // Prepare quick actions data
  const quickActions: ActionItem[] = useMemo(() => [
    {
      icon: <Briefcase size={20} />,
      label: 'New Case',
      onClick: () => navigate('/cases/new'),
      variant: 'primary'
    },
    {
      icon: <Calendar size={20} />,
      label: 'Schedule Hearing',
      onClick: () => navigate('/hearings/new'),
      variant: 'success'
    },
    {
      icon: <FileText size={20} />,
      label: 'Upload Document',
      onClick: () => navigate('/documents/new'),
      variant: 'accent'
    },
    {
      icon: <Users size={20} />,
      label: 'Add Contact',
      onClick: () => navigate('/contacts'),
      variant: 'secondary'
    }
  ], [navigate]);

  // Convert RecentActivity to ActivityItem for Card component
  const activities: ActivityItem[] = useMemo(() => {
    return recentActivity.map(activity => {
      const timeAgo = new Date(activity.timestamp).toLocaleDateString();
      
      const getActivityIcon = (entityType: string) => {
        switch (entityType) {
          case 'Case': return <Briefcase size={16} />;
          case 'Hearing': return <Calendar size={16} />;
          case 'Document': return <FileText size={16} />;
          case 'Contact': return <Users size={16} />;
          default: return <Activity size={16} />;
        }
      };
      
      const getVariant = (action: string): 'default' | 'success' | 'warning' | 'error' => {
        switch (action) {
          case 'Create': return 'success';
          case 'Update': return 'default';
          case 'Delete': return 'error';
          default: return 'default';
        }
      };
      
      return {
        id: activity.id,
        icon: getActivityIcon(activity.entityType),
        title: activity.title,
        description: activity.description,
        timestamp: timeAgo,
        variant: getVariant(activity.action),
        onClick: () => {
          // Navigate to appropriate detail page based on entity type
          switch (activity.entityType) {
            case 'Case':
              navigate(`/cases/${activity.entityId}`);
              break;
            case 'Hearing':
              navigate('/hearings');
              break;
            case 'Document':
              navigate(`/documents/${activity.entityId}`);
              break;
            case 'Contact':
              navigate('/contacts');
              break;
            default:
              navigate('/notifications');
          }
        }
      };
    });
  }, [recentActivity]);
  
  return (
    <div className="page-container">
      {/* Enhanced Header with Refresh Controls */}
      <div className="page-header mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Scale size={32} className="text-primary-600" />
              Executive Dashboard
            </h1>
            <p className="page-subtitle">
              Comprehensive overview of your legal practice performance and key metrics
            </p>
            {lastRefreshed && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(lastRefreshed).toLocaleString()} • Auto-refresh: 60s
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center gap-2 text-error-800">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced KPI Metrics Grid - Using new service data */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6 lg:gap-8 mb-8">
        {kpiCards.map((kpi) => {
          const iconMap: Record<string, React.ReactNode> = {
            'total-cases': <Briefcase size={24} className="text-primary-600" />,
            'upcoming-hearings': <Calendar size={24} className="text-success-600" />,
            'document-status': <FileText size={24} className="text-warning-600" />,
            'system-activity': <Activity size={24} className="text-accent-600" />,
            'contacts': <Contact size={24} className="text-secondary-600" />,
            'case-efficiency': <BarChart3 size={24} className="text-info-600" />
          };
          
          const getBadge = (kpi: KPICard) => {
            if (!kpi.badge) return undefined;
            
            const variantClasses = {
              success: 'bg-success-100 text-success-700',
              warning: 'bg-warning-100 text-warning-700',
              error: 'bg-error-100 text-error-700',
              info: 'bg-info-100 text-info-700'
            };
            
            return (
              <div className={`flex items-center gap-1 px-2 py-1 ${variantClasses[kpi.badge.variant]} rounded-full text-xs font-medium`}>
                {kpi.badge.variant === 'warning' && <AlertCircle size={12} />}
                {kpi.badge.variant === 'error' && <AlertCircle size={12} />}
                {kpi.badge.variant === 'success' && <CheckCircle2 size={12} />}
                {kpi.badge.text}
              </div>
            );
          };
          
          return (
            <Card 
              key={kpi.id}
              variant="metric"
              elevation="medium"
              interactive
              loading={isLoading}
              onClick={getKPINavigationHandler(kpi.id)}
              icon={iconMap[kpi.id] || <BarChart3 size={24} className="text-neutral-600" />}
              title={kpi.title}
              badge={getBadge(kpi)}
              metricData={convertToMetricData(kpi)}
            />
          );
        })}
      </div>

      {/* Secondary Content Grid - Using Card variant system */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <Card 
          variant="action-list"
          elevation="low"
          title="Quick Actions"
          icon={<ArrowRight size={20} />}
          actions={quickActions}
          className="lg:col-span-1"
        />

        <Card 
          variant="activity-feed"
          elevation="low"
          loading={isLoading}
          title="Recent Activity"
          subtitle={activities.length > 0 ? "Click any item to view details" : "No recent activity"}
          icon={<Activity size={20} />}
          activities={activities}
          className="lg:col-span-2"
          footer={
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/activity')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Activity size={16} />
                View All Activity
                <ArrowRight size={16} />
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default EnhancedDashboardHome;