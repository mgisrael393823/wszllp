import React from 'react';
import Card from '../ui/Card';

/**
 * Placeholder NotificationsPage component
 * The notification features have been deferred for the MVP
 */
const NotificationsPage: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <p className="text-gray-500">
        Notification features will be available in a future update.
      </p>
    </Card>
  );
};

export default NotificationsPage;