import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './shadcn-card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * MetricCard - A focused component for displaying KPIs and metrics
 * Used in dashboards for showing key statistics
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  onClick,
  className
}) => {
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={cn(
        "p-6",
        isClickable && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-semibold text-neutral-900">
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="flex-shrink-0">
              <div className="rounded-lg bg-neutral-100 p-3">
                <Icon className="h-6 w-6 text-neutral-600" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Example usage for reference
export const MetricCardExample = () => {
  return (
    <MetricCard
      title="Active Cases"
      value="42"
      trend={{ value: "+12%", isPositive: true }}
      subtitle="vs. last month"
      icon={undefined} // Pass actual icon component here
      onClick={() => console.log('Navigate to cases')}
    />
  );
};