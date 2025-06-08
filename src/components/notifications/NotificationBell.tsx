import React from 'react';
import { Bell } from 'lucide-react';

/**
 * Placeholder NotificationBell component
 * The notification features have been deferred for the MVP
 */
const NotificationBell: React.FC = () => {
  return (
    <button 
      className="relative p-2 text-neutral-400 hover:text-neutral-500" 
      aria-label="Notifications"
      onClick={() => alert('Notifications feature will be available in a future update.')}
    >
      <Bell className="h-6 w-6" />
    </button>
  );
};

export default NotificationBell;