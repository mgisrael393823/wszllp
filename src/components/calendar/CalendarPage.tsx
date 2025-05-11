import React from 'react';
import Card from '../ui/Card';

/**
 * Placeholder CalendarPage component
 * The full calendar functionality has been deferred for the MVP
 */
const CalendarPage: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Calendar</h2>
      <p className="text-gray-500">
        Calendar features will be available in a future update.
      </p>
    </Card>
  );
};

export default CalendarPage;