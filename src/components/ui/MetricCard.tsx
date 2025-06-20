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
        "p-6 bg-gradient-to-br from-white to-neutral-50/30 border-neutral-200/60",
        "shadow-sm hover:shadow-xl transition-all duration-300",
        isClickable && [
          "cursor-pointer",
          "hover:scale-[1.02] hover:-translate-y-1",
          "active:scale-[0.98] active:translate-y-0"
        ],
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-500 tracking-wide">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-sm font-semibold px-2 py-0.5 rounded-full",
                  trend.isPositive 
                    ? "text-success-700 bg-success-50 ring-1 ring-success-200/50" 
                    : "text-error-700 bg-error-50 ring-1 ring-error-200/50"
                )}>
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1.5 text-sm text-neutral-600 font-light">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-3 shadow-sm">
                <Icon className="h-6 w-6 text-primary-600" />
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
      onClick={() => {/* Navigate to cases */}}
    />
  );
};