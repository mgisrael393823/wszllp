import React from 'react';
import { Card } from '../ui/shadcn-card';

/**
 * Placeholder TemplateDetail component
 * The document template features have been deferred for the MVP
 */
const TemplateDetail: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Template Details</h2>
      <p className="text-neutral-500">
        Document template details will be available in a future update.
      </p>
    </Card>
  );
};

export default TemplateDetail;