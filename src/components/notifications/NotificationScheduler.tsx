import React, { useEffect } from 'react';
import { useData } from '../../context/DataContext';

/**
 * Invisible component that periodically checks for and generates notifications
 * This runs silently in the background to handle notification generation
 */
const NotificationScheduler: React.FC = () => {
  const { dispatch } = useData();
  
  // Set up notification checking on component mount and every hour after
  useEffect(() => {
    // Function to generate notifications
    const generateNotifications = () => {
      // Generate hearing notifications
      dispatch({ type: 'GENERATE_HEARING_NOTIFICATIONS' });
      
      // Generate deadline notifications
      dispatch({ type: 'GENERATE_DEADLINE_NOTIFICATIONS' });
    };
    
    // Run once on mount
    generateNotifications();
    
    // Set up interval to run every hour (3600000ms)
    const interval = setInterval(generateNotifications, 3600000);
    
    // Clean up the interval on unmount
    return () => clearInterval(interval);
  }, [dispatch]);
  
  // This component doesn't render anything
  return null;
};

export default NotificationScheduler;