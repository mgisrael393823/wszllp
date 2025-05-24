import React from 'react';

const CaseSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Search and Filter Row Skeleton */}
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <div className="h-10 bg-neutral-200 rounded-md animate-pulse" />
      </div>
      <div className="w-full md:w-48">
        <div className="h-10 bg-neutral-200 rounded-md animate-pulse" />
      </div>
    </div>

    {/* Table Skeleton */}
    <div className="table-container skeleton-table">
      {/* Table Header */}
      <div className="table-header">
        <div className="grid grid-cols-5 gap-4 table-cell">
          <div className="h-4 bg-neutral-300 rounded animate-pulse" />
          <div className="h-4 bg-neutral-300 rounded animate-pulse" />
          <div className="h-4 bg-neutral-300 rounded animate-pulse" />
          <div className="h-4 bg-neutral-300 rounded animate-pulse" />
          <div className="h-4 bg-neutral-300 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="skeleton-row">
          <div className="grid grid-cols-5 gap-4 table-cell">
            <div className="h-4 bg-neutral-200 rounded animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded animate-pulse" />
            <div className="h-6 w-16 bg-neutral-200 rounded-full animate-pulse" /> {/* Status badge */}
            <div className="h-4 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>

    {/* Pagination Skeleton */}
    <div className="flex justify-between items-center">
      <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
      <div className="flex space-x-2">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-8 w-8 bg-neutral-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export default CaseSkeleton;
