import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './shadcn-card';
import Button from './Button';

interface StatusCardProps {
  title: string;
  status: 'active' | 'pending' | 'completed' | 'overdue' | 'draft';
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }[];
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  className?: string;
}

/**
 * StatusCard - For displaying entities with status indicators
 * Used for cases, documents, and other items that have workflow states
 */
export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  subtitle,
  description,
  icon: Icon,
  actions,
  metadata,
  className
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return {
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'pending':
        return {
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'completed':
        return {
          badge: 'bg-green-100 text-green-700 border-green-200',
          icon: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'overdue':
        return {
          badge: 'bg-red-100 text-red-700 border-red-200',
          icon: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'draft':
      default:
        return {
          badge: 'bg-neutral-100 text-neutral-700 border-neutral-200',
          icon: 'bg-neutral-100',
          iconColor: 'text-neutral-600'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={cn("rounded-lg p-2", styles.icon)}>
              <Icon className={cn("h-5 w-5", styles.iconColor)} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-neutral-900 truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p>
                )}
              </div>
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                styles.badge
              )}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {description && (
          <p className="text-sm text-neutral-600 mb-4">{description}</p>
        )}
        
        {metadata && metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {metadata.map((item, index) => (
              <div key={index}>
                <p className="text-xs text-neutral-500">{item.label}</p>
                <p className="text-sm font-medium text-neutral-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}
        
        {actions && actions.length > 0 && (
          <div className="flex gap-2 pt-3 border-t border-neutral-100">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Example usage for reference
export const StatusCardExample = () => {
  return (
    <StatusCard
      title="Case #2024-001"
      status="active"
      subtitle="Smith vs. Johnson"
      description="Eviction case pending hearing on March 15, 2024"
      metadata={[
        { label: "Filed", value: "Jan 15, 2024" },
        { label: "Next Action", value: "Hearing" }
      ]}
      actions={[
        { label: "View Details", onClick: () => {}, variant: "primary" },
        { label: "Add Note", onClick: () => {} }
      ]}
    />
  );
};