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
import { EmptyState, LoadingState, ErrorState } from '../ui';
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

  // Helper functions for activity display
  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Case': return <Briefcase size={16} />;
      case 'Hearing': return <Calendar size={16} />;
      case 'Document': return <FileText size={16} />;
      case 'Contact': return <Users size={16} />;
      default: return <Activity size={16} />;
    }
  };
  
  const getActionColor = (action: string): string => {
    switch (action) {
      case 'Create': return 'text-green-600';
      case 'Update': return 'text-blue-600';
      case 'Delete': return 'text-red-600';
      default: return 'text-neutral-600';
    }
  };

  const handleActivityClick = (activity: RecentActivity) => {
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
  };

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
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
        {/* Feed Header */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-neutral-600" />
            <h2 className="text-lg font-medium text-neutral-900">
              Recent Activity ({filteredActivities.length} items)
            </h2>
          </div>
          {filteredActivities.length > 0 && (
            <p className="text-sm text-neutral-500 mt-1">
              Click any item to view details
            </p>
          )}
        </div>

        {/* Activity List */}
        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            <div className="p-8">
              <LoadingState message="Loading recent activity..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState 
                title="Failed to load activity"
                message={error}
                action={{
                  label: "Retry",
                  onClick: handleRefresh
                }}
              />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Activity className="w-16 h-16 text-neutral-400" />}
                title="No activity found"
                description={entityFilter 
                  ? `No recent ${entityFilter.toLowerCase()} activities to display.`
                  : "No recent activities to display. Activity will appear here as you work with cases, hearings, documents, and contacts."
                }
              />
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-neutral-500">
                            {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className={`text-xs font-medium ${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs text-neutral-500">
                            {activity.entityType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;