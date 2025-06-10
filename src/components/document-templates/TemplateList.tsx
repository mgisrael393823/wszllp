import React from 'react';
import { Card } from '../ui/shadcn-card';

/**
 * Placeholder TemplateList component
 * The document template features have been deferred for the MVP
 */
const TemplateList: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Document Templates</h2>
      <p className="text-neutral-500">
        Document templates and generation will be available in a future update.
      </p>
    </Card>
  );
};

export default TemplateList;