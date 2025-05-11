import React from 'react';
import Card from '../ui/Card';

/**
 * Placeholder DashboardHome component
 * The full dashboard functionality has been deferred for the MVP
 */
const DashboardHome: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <p className="text-gray-500">
        Advanced dashboard features will be available in a future update.
      </p>
    </Card>
  );
};

export default DashboardHome;