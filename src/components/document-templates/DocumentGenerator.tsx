import React from 'react';
import { Card } from '../ui/shadcn-card';

/**
 * Placeholder DocumentGenerator component
 * The document generation features have been deferred for the MVP
 */
const DocumentGenerator: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Document Generator</h2>
      <p className="text-neutral-500">
        Document generation will be available in a future update.
      </p>
    </Card>
  );
};

export default DocumentGenerator;