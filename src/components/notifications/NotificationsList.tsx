import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Bell, Calendar, FileText, Check, X, Clock, AlertTriangle, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Notification } from '../../types/schema';

const getNotificationIcon = (notificationType: Notification['type']) => {
  switch (notificationType) {
    case 'Deadline':
      return <Clock size={18} className="text-yellow-500" />;
    case 'Hearing':
      return <Calendar size={18} className="text-blue-500" />;
    case 'Document':
      return <FileText size={18} className="text-green-500" />;
    case 'System':
      return <Bell size={18} className="text-purple-500" />;
    case 'Alert':
      return <AlertTriangle size={18} className="text-red-500" />;
    default:
      return <Bell size={18} className="text-gray-500" />;
  }
};

const NotificationsList: React.FC = () => {
  const { state, dispatch } = useData();
  const [filter, setFilter] = useState<string>('all');
  const [showRead, setShowRead] = useState(false);

  // Sort notifications by date (newest first)
  // and filter by type and read status
  const filteredNotifications = state.notifications
    .filter(notification => {
      if (filter === 'all') return true;
      return notification.type === filter;
    })
    .filter(notification => {
      if (showRead) return true;
      return !notification.isRead;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleMarkAsRead = (notificationId: string) => {
    const notification = state.notifications.find(n => n.notificationId === notificationId);
    if (notification) {
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: {
          ...notification,
          isRead: true
        }
      });
    }
  };

  const handleMarkAllAsRead = () => {
    filteredNotifications.forEach(notification => {
      if (!notification.isRead) {
        dispatch({
          type: 'UPDATE_NOTIFICATION',
          payload: {
            ...notification,
            isRead: true
          }
        });
      }
    });
  };

  const handleDelete = (notificationId: string) => {
    dispatch({
      type: 'DELETE_NOTIFICATION',
      payload: notificationId
    });
  };

  const getRelatedLink = (notification: Notification) => {
    if (notification.entityType === 'Case' && notification.entityId) {
      return `/cases/${notification.entityId}`;
    } else if (notification.entityType === 'Hearing' && notification.entityId) {
      return `/hearings?id=${notification.entityId}`;
    } else if (notification.entityType === 'Document' && notification.entityId) {
      return `/documents/${notification.entityId}`;
    } else if (notification.entityType === 'Calendar' && notification.entityId) {
      return `/calendar?event=${notification.entityId}`;
    } else if (notification.entityType === 'Workflow' && notification.entityId) {
      return `/workflows/${notification.entityId}`;
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="show-read" className="text-sm font-medium text-gray-700">
              Show Read
            </label>
            <input
              id="show-read"
              type="checkbox"
              checked={showRead}
              onChange={() => setShowRead(!showRead)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
          </div>
          <div className="w-48">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Notifications' },
                { value: 'Deadline', label: 'Deadlines' },
                { value: 'Hearing', label: 'Hearings' },
                { value: 'Document', label: 'Documents' },
                { value: 'System', label: 'System' },
                { value: 'Alert', label: 'Alerts' },
              ]}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            icon={<Check size={16} />}
            disabled={filteredNotifications.every(n => n.isRead)}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <Bell size={24} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-1 text-gray-500">
              {filter !== 'all' 
                ? `You don't have any ${filter.toLowerCase()} notifications.` 
                : showRead 
                  ? "You don't have any notifications yet."
                  : "You don't have any unread notifications."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <Card key={notification.notificationId}>
              <div className={`flex items-start p-1 ${notification.isRead ? 'opacity-60' : ''}`}>
                <div className="flex-shrink-0 pt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between">
                    <p className={`text-base font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <div className="flex space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          className="text-gray-400 hover:text-gray-500"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.notificationId)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete notification"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>
                        {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                        {' • '}
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      {notification.priority === 'High' && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                    {notification.entityType && notification.entityId && (
                      <a
                        href={getRelatedLink(notification)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        View {notification.entityType}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;