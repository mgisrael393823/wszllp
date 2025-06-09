import React from 'react';
import { cn } from '@/lib/utils';
import CardBodyLayout from './CardBodyLayout';
import Typography from './Typography';
import { useCardSize } from './CardContext';

// Progress bar system
const progressBarSizes = {
  width: 'w-full',
  height: 'h-2',
  fill: 'h-full',
};

interface MetricData {
  value: number;
  progress?: { current: number; max: number; variant?: 'primary' | 'success' | 'warning' | 'error' };
  trend?: { icon: React.ReactNode; label: string; color: string };
  subtitle: string;
}

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'accent' | 'secondary';
}

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

// Standardized Metric Content Component
interface MetricContentProps {
  data: MetricData;
  fillHeight?: boolean;
}

export const MetricContent: React.FC<MetricContentProps> = ({ data, fillHeight = true }) => {
  const { config } = useCardSize();
  
  const AnimatedCounter = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = React.useState(0);
    
    React.useEffect(() => {
      let start = 0;
      const end = value;
      const duration = 1000;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }, [value]);
    
    return <span>{displayValue}</span>;
  };

  const ProgressBar = ({ current, max, variant: progressVariant = 'primary' }: { current: number; max: number; variant?: string }) => {
    const percentage = Math.min((current / max) * 100, 100);
    
    const progressStyles = {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
    };
    
    return (
      <div className="space-y-2">
        <div className={`${progressBarSizes.width} bg-neutral-200 rounded-full ${progressBarSizes.height} overflow-hidden`}>
          <div 
            className={`${progressBarSizes.fill} ${progressStyles[progressVariant as keyof typeof progressStyles]} transition-all duration-1000 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between">
          <Typography variant="caption" color="medium">{current}</Typography>
          <Typography variant="caption" color="medium">{max}</Typography>
        </div>
      </div>
    );
  };

  return (
    <CardBodyLayout spacing="normal" fillHeight={fillHeight}>
      {/* Primary Metric Value */}
      <div className={cn(config.typography.metric, "leading-none")}>
        <AnimatedCounter value={data.value} />
      </div>
      
      {/* Optional Progress Bar */}
      {data.progress && (
        <ProgressBar 
          current={data.progress.current}
          max={data.progress.max}
          variant={data.progress.variant}
        />
      )}
      
      {/* Optional Trend Indicator */}
      {data.trend && (
        <div className={`flex items-center gap-2 ${data.trend.color}`}>
          <span className={`${config.icon.size} flex-shrink-0 inline-flex items-center justify-center`}>
            {data.trend.icon}
          </span>
          <span className={cn(config.typography.caption, "font-medium")}>{data.trend.label}</span>
        </div>
      )}
      
      {/* Subtitle */}
      <p className={cn(config.typography.caption, "text-neutral-600 leading-tight")}>
        {data.subtitle}
      </p>
    </CardBodyLayout>
  );
};

// Standardized Action List Component
interface ActionListContentProps {
  actions: ActionItem[];
  fillHeight?: boolean;
}

export const ActionListContent: React.FC<ActionListContentProps> = ({ actions, fillHeight = true }) => {
  const { config } = useCardSize();
  
  const actionVariantStyles = {
    primary: 'hover:border-primary-300 hover:bg-primary-50/50 text-primary-600',
    success: 'hover:border-success-300 hover:bg-success-50/50 text-success-600',
    accent: 'hover:border-accent-300 hover:bg-accent-50/50 text-accent-600',
    secondary: 'hover:border-secondary-300 hover:bg-secondary-50/50 text-secondary-600',
  };

  return (
    <CardBodyLayout spacing="tight" fillHeight={fillHeight}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={cn(
            'w-full flex items-center bg-white border border-neutral-200',
            config.button.padding,
            config.button.gap,
            'rounded-lg',
            'hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-sm',
            'transition-all group'
          )}
        >
          <div className={cn(
            "flex items-center justify-center",
            config.icon.containerPadding,
            "bg-primary-50 text-primary-600 rounded-md group-hover:bg-primary-100 transition-colors"
          )}>
            <span className={config.icon.size}>
              {action.icon}
            </span>
          </div>
          <span className={cn(config.typography.body, "font-medium text-neutral-700 group-hover:text-neutral-900")}>{action.label}</span>
          <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </CardBodyLayout>
  );
};

// Standardized Activity Feed Component
interface ActivityFeedContentProps {
  activities: ActivityItem[];
  fillHeight?: boolean;
}

export const ActivityFeedContent: React.FC<ActivityFeedContentProps> = ({ activities, fillHeight = true }) => {
  const { config } = useCardSize();
  
  const ActivityButton = ({ activity }: { activity: ActivityItem }) => {
    const variantStyles = {
      default: { 
        icon: 'text-neutral-600 bg-neutral-100', 
        border: 'border-neutral-200/60',
        hover: 'hover:border-neutral-300 hover:bg-neutral-50'
      },
      success: { 
        icon: 'text-success-600 bg-success-100', 
        border: 'border-success-200/60',
        hover: 'hover:border-success-300 hover:bg-success-50/50'
      },
      warning: { 
        icon: 'text-warning-600 bg-warning-100', 
        border: 'border-warning-200/60',
        hover: 'hover:border-warning-300 hover:bg-warning-50/50'
      },
      error: { 
        icon: 'text-error-600 bg-error-100', 
        border: 'border-error-200/60',
        hover: 'hover:border-error-300 hover:bg-error-50/50'
      },
    };
    
    const styles = variantStyles[activity.variant || 'default'];
    
    return (
      <div
        onClick={activity.onClick}
        className={cn(
          'w-full flex items-start gap-3 p-3',
          'bg-neutral-50/50 rounded-lg',
          'hover:bg-neutral-100/50',
          'transition-colors duration-200',
          activity.onClick && 'cursor-pointer'
        )}
      >
        <div className={cn(
          'flex-shrink-0 rounded-md flex items-center justify-center',
          config.icon.containerPadding,
          styles.icon,
          'transition-transform duration-200'
        )}>
          <span className={config.icon.size}>{activity.icon}</span>
        </div>
        
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={cn("text-sm font-medium text-neutral-900 truncate")}>
            {activity.title}
          </p>
          <p className={cn("text-xs text-neutral-600 line-clamp-2")}>
            {activity.description}
          </p>
          <p className={cn("text-xs text-neutral-500")}>
            {activity.timestamp}
          </p>
        </div>
        
        {activity.onClick && (
          <div className="flex-shrink-0">
            <svg className={`${config.icon.size} text-neutral-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  if (activities.length === 0) {
    return (
      <CardBodyLayout fillHeight={fillHeight} className="items-center justify-center text-center text-neutral-500">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className={cn(config.typography.title, "text-neutral-700")}>No recent activity</h3>
        <p className={cn(config.typography.caption, "text-neutral-500")}>Activity will appear here as you use the system</p>
      </CardBodyLayout>
    );
  }

  return (
    <CardBodyLayout spacing="tight" fillHeight={fillHeight} className="max-h-80 overflow-y-auto">
      {activities.map((activity) => (
        <ActivityButton key={activity.id} activity={activity} />
      ))}
    </CardBodyLayout>
  );
};