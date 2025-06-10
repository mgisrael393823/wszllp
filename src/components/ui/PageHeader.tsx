import React from 'react';
import Button from './Button';
import Typography from './Typography';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  
  // Primary action (typically "Add New" or "Create")
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
  };
  
  // Secondary actions
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'text';
  }>;
  
  // Additional content (breadcrumbs, tabs, etc.)
  children?: React.ReactNode;
  
  className?: string;
}

/**
 * Standardized PageHeader component for consistent page title/actions pattern
 * Eliminates custom header implementations across pages
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryActions = [],
  children,
  className = ''
}) => {
  return (
    <div className={`page-header ${className}`}>
      {/* Title Section */}
      <div className="flex-1">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {description && (
          <Typography variant="caption" color="medium" className="mt-2 max-w-2xl">
            {description}
          </Typography>
        )}
        {children}
      </div>
      
      {/* Actions Section */}
      {(primaryAction || secondaryActions.length > 0) && (
        <div className="page-actions">
          {/* Secondary Actions */}
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          ))}
          
          {/* Primary Action */}
          {primaryAction && (
            <Button
              variant={primaryAction.variant || 'primary'}
              onClick={primaryAction.onClick}
              icon={primaryAction.icon}
              loading={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
