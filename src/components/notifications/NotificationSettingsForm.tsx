import React from 'react';
import Card from '../ui/Card';

/**
 * Placeholder NotificationSettingsForm component
 * The notification features have been deferred for the MVP
 */
const NotificationSettingsForm: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
      <p className="text-gray-500">
        Notification settings will be available in a future update.
      </p>
    </Card>
  );
};

export default NotificationSettingsForm;