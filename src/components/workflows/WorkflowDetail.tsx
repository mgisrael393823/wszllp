import React from 'react';
import { Card } from '../ui/shadcn-card';

/**
 * Placeholder WorkflowDetail component
 * The workflow automation features have been deferred for the MVP
 */
const WorkflowDetail: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Workflow Details</h2>
      <p className="text-neutral-500">
        Workflow details will be available in a future update.
      </p>
    </Card>
  );
};

export default WorkflowDetail;