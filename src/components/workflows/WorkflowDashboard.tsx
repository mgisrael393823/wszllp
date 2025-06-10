import React from 'react';
import { Card } from '../ui/shadcn-card';

/**
 * Placeholder WorkflowDashboard component
 * The workflow automation features have been deferred for the MVP
 */
const WorkflowDashboard: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Workflows</h2>
      <p className="text-neutral-500">
        Workflow automation features will be available in a future update.
      </p>
    </Card>
  );
};

export default WorkflowDashboard;