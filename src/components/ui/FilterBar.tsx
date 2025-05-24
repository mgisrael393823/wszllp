import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import Input from './Input';
import Select from './Select';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  // Search functionality
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Primary filter (typically status)
  primaryFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    icon?: React.ReactNode;
  };
  
  // Secondary filter (typically date)
  secondaryFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    icon?: React.ReactNode;
  };
  
  // Additional filters
  additionalFilters?: Array<{
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    icon?: React.ReactNode;
  }>;
  
  // Actions (buttons, etc.)
  actions?: React.ReactNode;
  
  className?: string;
}

/**
 * Standardized FilterBar component for consistent filtering across all list pages
 * Eliminates duplication and ensures consistent height alignment
 */
const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  primaryFilter,
  secondaryFilter,
  additionalFilters = [],
  actions,
  className = ''
}) => {
  return (
    <div className={`filter-bar ${className}`}>
      {/* Search Section */}
      <div className="filter-bar-search">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="filter-search mb-0"
          leftIcon={<Search className="icon-standard" />}
        />
      </div>
      
      {/* Filters and Actions Section */}
      <div className="filter-bar-controls">
        {/* Primary Filter */}
        {primaryFilter && (
          <div className="filter-bar-group">
            {primaryFilter.icon || <Filter className="icon-standard text-neutral-400" />}
            <Select
              value={primaryFilter.value}
              onChange={primaryFilter.onChange}
              options={primaryFilter.options}
              className="filter-select mb-0 w-32"
              placeholder={primaryFilter.placeholder}
              fullWidth={false}
            />
          </div>
        )}
        
        {/* Secondary Filter */}
        {secondaryFilter && (
          <div className="filter-bar-group">
            {secondaryFilter.icon || <Calendar className="icon-standard text-neutral-400" />}
            <Select
              value={secondaryFilter.value}
              onChange={secondaryFilter.onChange}
              options={secondaryFilter.options}
              className="filter-select mb-0 w-40"
              placeholder={secondaryFilter.placeholder}
              fullWidth={false}
            />
          </div>
        )}
        
        {/* Additional Filters */}
        {additionalFilters.map((filter, index) => (
          <div key={index} className="filter-bar-group">
            {filter.icon}
            <Select
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              className="filter-select mb-0 w-32"
              placeholder={filter.placeholder}
              fullWidth={false}
            />
          </div>
        ))}
        
        {/* Actions */}
        {actions && (
          <div className="filter-bar-group">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
