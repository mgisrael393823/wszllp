import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useData } from '../../context/DataContext';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { state } = useData();
  
  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative">
      <button
        className={`relative p-1 rounded-full ${className} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        onClick={toggleDropdown}
        aria-label={`${unreadCount} unread notifications`}
      >
        <Bell size={20} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 text-xs text-white bg-red-500 rounded-full flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-96 origin-top-right">
            <NotificationDropdown onClose={() => setIsDropdownOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;