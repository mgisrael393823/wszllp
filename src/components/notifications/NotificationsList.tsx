import React from 'react';
import Card from '../ui/Card';

/**
 * Placeholder NotificationsList component
 * The notification features have been deferred for the MVP
 */
const NotificationsList: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <p className="text-neutral-500">
        Notifications will be available in a future update.
      </p>
    </Card>
  );
};

export default NotificationsList;