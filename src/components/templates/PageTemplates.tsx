import React from 'react';
import Typography from '../ui/Typography';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Search, Filter, Download, Plus, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react';

/**
 * Dashboard Template
 * 
 * Used for main dashboard pages with multiple card sections
 */
export const DashboardTemplate: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="section-spacing">
      {/* Page header */}
      <div className="mb-6">
        <Typography variant="h1" className="mb-2">{title}</Typography>
        {description && (
          <Typography variant="body1" color="light" className="mt-0">
            {description}
          </Typography>
        )}
      </div>
      
      {/* Page content */}
      <div className="vr-lg">
        {children}
      </div>
    </div>
  );
};

/**
 * List Template
 * 
 * Used for displaying lists/tables of items with search and filtering
 */
export const ListTemplate: React.FC<{
  title: string;
  description?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}> = ({
  title,
  description,
  searchPlaceholder = "Search...",
  onSearch,
  actionLabel = "Add New",
  onAction,
  children
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };
  
  return (
    <div className="section-spacing">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Typography variant="h1" className="mb-2">{title}</Typography>
          {description && (
            <Typography variant="body1" color="light" className="mt-0">
              {description}
            </Typography>
          )}
        </div>
        
        {onAction && (
          <div className="mt-4 md:mt-0">
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={onAction}
              elevation="low"
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
      
      {/* Search and filters */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="w-full relative">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
              fullWidth
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              Search
            </Button>
            
            <Button
              variant="outline"
              size="md"
              icon={<Filter size={16} />}
            >
              Filters
            </Button>
            
            <Button
              variant="outline"
              size="md"
              icon={<Download size={16} />}
            >
              Export
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Main content */}
      <div className="content-area">
        {children}
      </div>
    </div>
  );
};

/**
 * Detail Template
 * 
 * Used for displaying detailed information about a single item
 */
export const DetailTemplate: React.FC<{
  title: string;
  subtitle?: string;
  backLink?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}> = ({
  title,
  subtitle,
  backLink,
  onEdit,
  onDelete,
  children
}) => {
  return (
    <div className="section-spacing">
      {/* Page header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          {backLink && (
            <a href={backLink} className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block">
              ← Back to list
            </a>
          )}
          <Typography variant="h1" className="mb-1">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="light">
              {subtitle}
            </Typography>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {onEdit && (
            <Button
              variant="outline"
              size="md"
              icon={<Edit size={16} />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="outline"
              size="md"
              icon={<Trash2 size={16} />}
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content in a two-column layout */}
      <div className="two-col-layout">
        <div className="two-col-layout-main content-area">
          {children}
        </div>
        
        <div className="two-col-layout-side">
          <div className="sidebar-area">
            <Typography variant="h5" className="mb-4">Details</Typography>
            
            <div className="space-y-4">
              <div>
                <Typography variant="caption" color="light">Last Modified</Typography>
                <Typography variant="body2">June 15, 2023</Typography>
              </div>
              
              <div>
                <Typography variant="caption" color="light">Created By</Typography>
                <Typography variant="body2">John Smith</Typography>
              </div>
              
              <div>
                <Typography variant="caption" color="light">Status</Typography>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
            
            <hr className="my-4 border-neutral-200" />
            
            <Typography variant="h5" className="mb-4">Actions</Typography>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<Eye size={16} />}
              >
                Preview
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<Download size={16} />}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Form Template
 * 
 * Used for data entry forms with multiple sections
 */
export const FormTemplate: React.FC<{
  title: string;
  subtitle?: string;
  backLink?: string;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  children: React.ReactNode;
}> = ({
  title,
  subtitle,
  backLink,
  onSubmit,
  onCancel,
  isSubmitting = false,
  children
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form data would be collected here in a real implementation
    onSubmit({});
  };
  
  return (
    <div className="section-spacing">
      {/* Page header */}
      <div className="mb-6">
        {backLink && (
          <a href={backLink} className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block">
            ← Back
          </a>
        )}
        <Typography variant="h1" className="mb-1">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="light">
            {subtitle}
          </Typography>
        )}
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="content-area">
          {children}
          
          {/* Form actions */}
          <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

/**
 * Settings Template
 * 
 * Used for settings pages with categorized options
 */
export const SettingsTemplate: React.FC<{
  title: string;
  description?: string;
  categories: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  children: React.ReactNode;
}> = ({
  title,
  description,
  categories,
  activeCategory,
  onCategoryChange,
  children
}) => {
  return (
    <div className="section-spacing">
      {/* Page header */}
      <div className="mb-6">
        <Typography variant="h1" className="mb-2">{title}</Typography>
        {description && (
          <Typography variant="body1" color="light" className="mt-0">
            {description}
          </Typography>
        )}
      </div>
      
      {/* Settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <Typography variant="subtitle1">Categories</Typography>
            </div>
            <div className="p-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`
                    w-full text-left px-4 py-2 text-sm rounded-md flex items-center
                    ${activeCategory === category.id 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-neutral-700 hover:bg-neutral-50'}
                  `}
                >
                  {category.icon && <span className="mr-3">{category.icon}</span>}
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Settings content */}
        <div className="lg:col-span-3 content-area">
          {children}
        </div>
      </div>
    </div>
  );
};