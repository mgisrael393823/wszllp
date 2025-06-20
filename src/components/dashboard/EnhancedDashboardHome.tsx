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
  Contact,
  Plus
} from 'lucide-react';
import { MetricCard, StatusCard, ActionListCard } from '../ui';
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
  
  // Generate fallback KPI cards if service fails
  const generateFallbackKPICards = (): KPICard[] => {
    const activeCases = state.cases.filter(c => c.status === 'active').length;
    const totalCases = state.cases.length;
    const upcomingHearings = state.hearings.filter(
      h => new Date(h.hearingDate) > new Date()
    ).length;
    const totalContacts = state.contacts?.length || 0;
    
    return [
      {
        id: 'total-cases',
        title: 'Total Cases',
        value: totalCases.toString(),
        change: '+12%',
        changeType: 'positive',
        subtitle: `${activeCases} active`,
        badge: activeCases > 0 ? { text: `${activeCases} Active`, variant: 'success' } : undefined
      },
      {
        id: 'upcoming-hearings',
        title: 'Upcoming Hearings',
        value: upcomingHearings.toString(),
        change: '-2',
        changeType: 'negative',
        subtitle: 'This month',
        badge: upcomingHearings > 5 ? { text: 'Busy Week', variant: 'warning' } : undefined
      },
      {
        id: 'contacts',
        title: 'Total Contacts',
        value: totalContacts.toString(),
        change: '+8',
        changeType: 'positive',
        subtitle: 'All time'
      }
    ];
  };
  
  // Generate fallback activity if service fails
  const generateFallbackActivity = (): RecentActivity[] => {
    return state.auditLogs.slice(0, 5).map(log => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      title: `${log.entityType} ${log.action}`,
      description: `User performed ${log.action} on ${log.entityType}`,
      timestamp: log.timestamp,
      userId: log.userId,
      metadata: log.metadata
    }));
  };
  
  // Navigation handlers for KPI cards
  const getKPINavigationHandler = (kpiId: string) => {
    return () => {
      switch (kpiId) {
        case 'total-cases':
          navigate('/cases');
          break;
        case 'upcoming-hearings':
          navigate('/hearings');
          break;
        case 'document-status':
          navigate('/documents');
          break;
        case 'contacts':
          navigate('/contacts');
          break;
        case 'system-activity':
          navigate('/activity');
          break;
        default:
          navigate('/');
      }
    };
  };

  // Icon mapping for KPI cards
  const iconMap = {
    'total-cases': Briefcase,
    'upcoming-hearings': Calendar,
    'document-status': FileText,
    'system-activity': Activity,
    'contacts': Contact,
    'case-efficiency': BarChart3
  };

  // Convert recent activity to action list items
  const activityItems = useMemo(() => {
    return recentActivity.slice(0, 5).map(activity => {
      const timeAgo = new Date(activity.timestamp).toLocaleDateString();
      
      const getActivityIcon = (entityType: string) => {
        switch (entityType) {
          case 'Case': return Briefcase;
          case 'Hearing': return Calendar;
          case 'Document': return FileText;
          case 'Contact': return Users;
          default: return Activity;
        }
      };
      
      return {
        id: activity.id,
        icon: getActivityIcon(activity.entityType),
        title: activity.title,
        subtitle: activity.description,
        value: timeAgo,
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
              navigate('/activity');
          }
        }
      };
    });
  }, [recentActivity, navigate]);

  // Quick action items
  const quickActionItems = useMemo(() => [
    {
      id: 'new-case',
      icon: Plus,
      title: 'Create New Case',
      subtitle: 'Start a new legal matter',
      onClick: () => navigate('/cases/new')
    },
    {
      id: 'schedule-hearing',
      icon: Calendar,
      title: 'Schedule Hearing',
      subtitle: 'Add to calendar',
      onClick: () => navigate('/hearings/new')
    },
    {
      id: 'upload-doc',
      icon: FileText,
      title: 'Upload Document',
      subtitle: 'Add to case file',
      onClick: () => navigate('/documents/upload')
    },
    {
      id: 'add-contact',
      icon: Users,
      title: 'Add Contact',
      subtitle: 'Client or attorney',
      onClick: () => navigate('/contacts')
    }
  ], [navigate]);
  
  return (
    <div className="page-container space-y-layout-normal">
      {/* Enhanced Header with Improved Refresh Controls */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="page-title flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-sm">
                <Scale className="w-8 h-8 text-primary-600" />
              </div>
              <span className="bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">Executive Dashboard</span>
            </h1>
            <p className="page-subtitle mt-2 text-neutral-600">
              Comprehensive overview of your legal practice performance and key metrics
            </p>
            {lastRefreshed && (
              <div className="mt-2">
                <p className="text-xs text-neutral-600 font-medium">
                  Last updated: {new Date(lastRefreshed).toLocaleString()}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse shadow-glow-sm"></div>
                  <span className="font-medium">Auto-refresh: 60s</span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={isRefreshing ? 'Refreshing data...' : 'Refresh dashboard data'}
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced KPI Metrics Grid - Using new MetricCard component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-content-comfortable">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : (
          kpiCards.map((kpi) => {
            const Icon = iconMap[kpi.id as keyof typeof iconMap] || BarChart3;
            
            return (
              <MetricCard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                icon={Icon}
                trend={kpi.change ? {
                  value: kpi.change,
                  isPositive: kpi.changeType === 'positive'
                } : undefined}
                subtitle={kpi.subtitle}
                onClick={getKPINavigationHandler(kpi.id)}
              />
            );
          })
        )}
      </div>

      {/* Secondary Content Grid - Using new ActionListCard component */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-content-comfortable">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <ActionListCard
            title="Quick Actions"
            description="Common tasks and shortcuts"
            items={quickActionItems}
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          {activityItems.length > 0 ? (
            <ActionListCard
              title="Recent Activity"
              description="Latest updates across your cases"
              items={activityItems}
            />
          ) : (
            <StatusCard
              title="No Recent Activity"
              status="draft"
              icon={Activity}
              description="Activity will appear here as you work with cases, documents, and contacts."
              actions={[
                { label: "Create New Case", onClick: () => navigate('/cases/new'), variant: 'primary' }
              ]}
            />
          )}
          
          {/* View All Activity Link */}
          {activityItems.length > 0 && (
            <div className="mt-content-normal text-center">
              <button
                onClick={() => navigate('/activity')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Activity className="w-4 h-4" />
                View All Activity
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardHome;