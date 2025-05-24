import React from 'react';

const CaseSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 w-1/3 bg-neutral-200 rounded" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-24 bg-neutral-200 rounded" />
      ))}
    </div>
  </div>
);

export default CaseSkeleton;
