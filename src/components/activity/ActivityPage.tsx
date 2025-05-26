import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Calendar, 
  FileText, 
  Users, 
  Briefcase,
  Clock,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card, { type ActivityItem } from '../ui/Card';
import dashboardService, { type RecentActivity } from '../../services/dashboardService';

/**
 * Dedicated Activity Page with comprehensive activity feed
 * Auto-refreshes every 60 seconds and shows chronological list of all activities
 */
const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [limit, setLimit] = useState(50); // Show more activities on dedicated page

  // Load activity data
  const loadActivityData = async () => {
    try {
      setError(null);
      const activityData = await dashboardService.getRecentActivity(limit);
      setActivities(activityData);
      setLastRefreshed(new Date().toISOString());
    } catch (err) {
      console.error('Error loading activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    loadActivityData();
    
    // Set up real-time subscriptions
    const unsubscribe = dashboardService.subscribeToUpdates(() => {
      loadActivityData();
    });
    
    // Set up auto-refresh every 60 seconds
    const autoRefreshInterval = setInterval(() => {
      if (!isRefreshing) {
        loadActivityData();
      }
    }, 60000);
    
    return () => {
      unsubscribe();
      clearInterval(autoRefreshInterval);
    };
  }, [isRefreshing, limit]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadActivityData();
    } catch (err) {
      console.error('Error refreshing activity:', err);
      setError('Failed to refresh activity data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter activities by entity type
  const filteredActivities = entityFilter 
    ? activities.filter(activity => activity.entityType === entityFilter)
    : activities;

  // Convert RecentActivity to ActivityItem for Card component
  const activityItems: ActivityItem[] = filteredActivities.map(activity => {
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

  const entityTypes = ['Case', 'Hearing', 'Document', 'Contact'];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Activity size={32} className="text-primary-600" />
              Activity Feed
            </h1>
            <p className="page-subtitle">
              Chronological list of all recent actions across your legal practice
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
              <Activity size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <label className="text-sm font-medium">Filter by type:</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1 border border-neutral-200 rounded-md text-sm bg-white"
          >
            <option value="">All Activities</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}s</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Show:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1 border border-neutral-200 rounded-md text-sm bg-white"
          >
            <option value={25}>Last 25</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 gap-6">
        <Card 
          variant="activity-feed"
          elevation="low"
          loading={isLoading}
          title={`Recent Activity (${filteredActivities.length} items)`}
          subtitle={activityItems.length > 0 ? "Click any item to view details" : "No activities found"}
          icon={<Clock size={20} />}
          activities={activityItems}
          className="min-h-[500px]"
        />
      </div>
    </div>
  );
};

export default ActivityPage;