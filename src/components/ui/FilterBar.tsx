import React from 'react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
      className
    )}>
      {children}
    </div>
  );
};

interface FilterItemProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2; // How many columns to span
}

export const FilterItem: React.FC<FilterItemProps> = ({ 
  label, 
  children, 
  className,
  span = 1 
}) => {
  return (
    <div className={cn(
      "space-y-1",
      span === 2 && "sm:col-span-2",
      className
    )}>
      <label className="block text-xs font-medium text-neutral-600">
        {label}
      </label>
      {children}
    </div>
  );
};

export default FilterBar;