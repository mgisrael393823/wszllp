import React from 'react';
import Card from '../ui/Card';

/**
 * Dashboard Home component with standardized layout
 * Uses consistent page structure and design tokens
 */
const DashboardHome: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Advanced dashboard features will be available in a future update.
        </p>
      </div>
      
      <Card className="p-6">
        <p className="text-neutral-600">
          Dashboard content coming soon...
        </p>
      </Card>
    </div>
  );
};

export default DashboardHome;