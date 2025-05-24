import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import Button from './Button';

// Loading State Component
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };
  
  const spinnerSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`loading-container ${sizeClasses[size]} ${className}`}>
      <Loader2 className={`loading-spinner ${spinnerSizes[size]} mb-4`} />
      <p className="text-neutral-500">{message}</p>
    </div>
  );
};

// Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Please try again later",
  action,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <AlertCircle className="w-16 h-16 text-error-400" />
      </div>
      <h3 className="empty-state-title text-error-900">{title}</h3>
      <p className="empty-state-description">{message}</p>
      {action && (
        <Button
          variant="outline"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  const defaultIcon = <Inbox className="w-16 h-16" />;
  
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        {icon || defaultIcon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Combined export for convenience
const StateComponents = {
  LoadingState,
  ErrorState,
  EmptyState
};

export default StateComponents;
