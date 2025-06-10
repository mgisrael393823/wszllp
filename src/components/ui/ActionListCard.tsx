import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './shadcn-card';

interface ActionListItem {
  id: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  value?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error';
  };
  onClick?: () => void;
}

interface ActionListCardProps {
  title: string;
  description?: string;
  items: ActionListItem[];
  onActionClick?: (itemId: string) => void;
  className?: string;
  showDividers?: boolean;
}

/**
 * ActionListCard - For displaying lists of actionable items
 * Used in dashboards for quick actions, recent items, or navigation lists
 */
export const ActionListCard: React.FC<ActionListCardProps> = ({
  title,
  description,
  items,
  onActionClick,
  className,
  showDividers = true
}) => {
  const handleItemClick = (item: ActionListItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (onActionClick) {
      onActionClick(item.id);
    }
  };

  const getBadgeStyles = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-neutral-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isClickable = !!(item.onClick || onActionClick);
            
            return (
              <div
                key={item.id}
                className={cn(
                  "px-6 py-4 flex items-center gap-3",
                  isClickable && "hover:bg-neutral-50 cursor-pointer transition-colors",
                  !showDividers && index !== 0 && "border-t-0"
                )}
                onClick={() => isClickable && handleItemClick(item)}
              >
                {Icon && (
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-neutral-500" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-sm text-neutral-500 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                
                {item.value && (
                  <div className="flex-shrink-0 text-sm font-medium text-neutral-900">
                    {item.value}
                  </div>
                )}
                
                {item.badge && (
                  <span className={cn(
                    "flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    getBadgeStyles(item.badge.variant)
                  )}>
                    {item.badge.text}
                  </span>
                )}
                
                {isClickable && (
                  <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Example usage for reference
export const ActionListCardExample = () => {
  return (
    <ActionListCard
      title="Recent Cases"
      description="Your most recently accessed cases"
      items={[
        {
          id: '1',
          title: 'Smith vs. Johnson',
          subtitle: 'Case #2024-001',
          value: '2 days ago',
          onClick: () => console.log('Navigate to case 1')
        },
        {
          id: '2',
          title: 'Davis Property Eviction',
          subtitle: 'Case #2024-002',
          value: '5 days ago',
          badge: { text: 'Urgent', variant: 'warning' },
          onClick: () => console.log('Navigate to case 2')
        },
        {
          id: '3',
          title: 'Thompson Lease Dispute',
          subtitle: 'Case #2024-003',
          value: '1 week ago',
          onClick: () => console.log('Navigate to case 3')
        }
      ]}
    />
  );
};