import React from 'react';
import { format } from 'date-fns';
import { Bell, Calendar, FileText, AlertTriangle, Clock, Check, ChevronRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types/schema';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { state, dispatch } = useData();
  const navigate = useNavigate();

  // Get unread notifications and sort by date (newest first)
  const unreadNotifications = state.notifications
    .filter(n => !n.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Show only the 5 most recent

  const getNotificationIcon = (notificationType: Notification['type']) => {
    switch (notificationType) {
      case 'Deadline':
        return <Clock size={16} className="text-yellow-500" />;
      case 'Hearing':
        return <Calendar size={16} className="text-blue-500" />;
      case 'Document':
        return <FileText size={16} className="text-green-500" />;
      case 'System':
        return <Bell size={16} className="text-purple-500" />;
      case 'Alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

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
    unreadNotifications.forEach(notification => {
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: {
          ...notification,
          isRead: true
        }
      });
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    handleMarkAsRead(notification.notificationId);
    
    // Navigate to related entity
    if (notification.entityType === 'Case' && notification.entityId) {
      navigate(`/cases/${notification.entityId}`);
    } else if (notification.entityType === 'Hearing' && notification.entityId) {
      navigate(`/hearings?id=${notification.entityId}`);
    } else if (notification.entityType === 'Document' && notification.entityId) {
      navigate(`/documents/${notification.entityId}`);
    } else if (notification.entityType === 'Calendar' && notification.entityId) {
      navigate(`/calendar?event=${notification.entityId}`);
    } else if (notification.entityType === 'Workflow' && notification.entityId) {
      navigate(`/workflows/${notification.entityId}`);
    }
    
    // Close the dropdown
    onClose();
  };

  const viewAllNotifications = () => {
    navigate('/notifications');
    onClose();
  };

  return (
    <div className="shadow-lg rounded-md bg-white border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
        {unreadNotifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {unreadNotifications.length === 0 ? (
          <div className="py-4 px-4 text-center">
            <p className="text-sm text-gray-500">No unread notifications</p>
          </div>
        ) : (
          <div>
            {unreadNotifications.map(notification => (
              <div 
                key={notification.notificationId} 
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="px-4 py-3 flex items-start">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.notificationId);
                      }}
                      className="text-gray-400 hover:text-indigo-600 rounded-full p-1"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-center cursor-pointer hover:bg-gray-100"
        onClick={viewAllNotifications}
      >
        <span className="text-xs font-medium text-indigo-600 flex items-center">
          View all notifications
          <ChevronRight size={14} className="ml-1" />
        </span>
      </div>
    </div>
  );
};

export default NotificationDropdown;