import React from 'react';
import { 
  Card as ShadcnCard,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
} from './shadcn-card';
import { cn } from '@/lib/utils';
import { MetricContent, ActionListContent, ActivityFeedContent } from './CardContent';
import Typography from './Typography';

type CardElevation = 'flat' | 'low' | 'medium' | 'high' | 'extreme';
type CardBorder = 'none' | 'light' | 'normal' | 'accent' | 'gradient';
type CardVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning' | 'metric' | 'action-list' | 'activity-feed' | 'content';
type CardSize = 'compact' | 'normal' | 'spacious' | 'featured';

// Specialized data interfaces for card variants
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

interface CardProps {
  children?: React.ReactNode;
  title?: string | React.ReactNode;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  elevation?: CardElevation;
  border?: CardBorder;
  variant?: CardVariant;
  size?: CardSize;
  compact?: boolean; // Deprecated: use size='compact' instead
  interactive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  glassmorphism?: boolean;
  gradient?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onHover?: React.MouseEventHandler<HTMLDivElement>;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  
  // Specialized variant data
  metricData?: MetricData;
  actions?: ActionItem[];
  activities?: ActivityItem[];
}

/**
 * Enhanced Card component with sophisticated visual treatments and interactions
 * Maintains backward compatibility while adding modern design features
 */
const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  elevation = 'low',
  border = 'light',
  variant = 'default',
  size = 'normal',
  compact = false, // Deprecated but maintained for compatibility
  interactive = false,
  loading = false,
  disabled = false,
  glassmorphism = false,
  gradient = false,
  onClick,
  onHover,
  icon,
  badge,
  metricData,
  actions,
  activities,
}) => {
  // Enhanced elevation system with sophisticated shadows
  const elevationStyles: Record<CardElevation, string> = {
    flat: '',
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
    extreme: 'shadow-2xl',
  };

  // Hover elevation effects
  const hoverElevationStyles: Record<CardElevation, string> = {
    flat: 'hover:shadow-sm',
    low: 'hover:shadow-md',
    medium: 'hover:shadow-lg',
    high: 'hover:shadow-xl',
    extreme: 'hover:shadow-2xl',
  };

  // Enhanced border system with gradients
  const borderStyles: Record<CardBorder, string> = {
    none: 'border-0',
    light: 'border border-neutral-200/60',
    normal: 'border border-neutral-300',
    accent: 'border border-primary-200',
    gradient: 'border border-transparent bg-gradient-to-r from-primary-200 via-accent-200 to-secondary-200 bg-clip-padding',
  };

  // Enhanced variant system with specialized card types
  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white',
    primary: 'bg-primary-50/50 border-primary-200',
    secondary: 'bg-secondary-50/50 border-secondary-200',
    accent: 'bg-accent-50/50 border-accent-200',
    success: 'bg-success-50/50 border-success-200',
    error: 'bg-error-50/50 border-error-200',
    warning: 'bg-warning-50/50 border-warning-200',
    metric: 'bg-gradient-to-br from-neutral-50/30 to-white border-neutral-200/60',
    'action-list': 'bg-gradient-to-br from-primary-50/20 to-white border-primary-200/40',
    'activity-feed': 'bg-white/80 backdrop-blur-sm border-neutral-200/40',
    content: 'bg-white/80 backdrop-blur-sm border-neutral-200/40',
  };

  // Systematic foundation system
  const actualSize = compact ? 'compact' : size; // Handle deprecated compact prop
  

  // Systematic icon sizing
  const iconSizes = {
    sm: 'w-4 h-4',   // 16px - for inline/secondary icons
    md: 'w-5 h-5',   // 20px - for standard UI icons  
    lg: 'w-6 h-6',   // 24px - for primary/header icons
  };




  // Size system with semantic spacing tokens
  const sizeStyles: Record<CardSize, { 
    padding: { x: string; y: string }; 
    borderRadius: string;
    iconSize: keyof typeof iconSizes;
  }> = {
    compact: {
      padding: { x: 'px-content-tight', y: 'py-content-tight' },
      borderRadius: 'rounded-lg',
      iconSize: 'sm',
    },
    normal: {
      padding: { x: 'px-content-comfortable', y: 'py-content-normal' },
      borderRadius: 'rounded-xl', 
      iconSize: 'md',
    },
    spacious: {
      padding: { x: 'px-content-spacious', y: 'py-content-comfortable' },
      borderRadius: 'rounded-xl',
      iconSize: 'lg', 
    },
    featured: {
      padding: { x: 'px-layout-compact', y: 'px-content-spacious' },
      borderRadius: 'rounded-2xl',
      iconSize: 'lg',
    },
  };
  
  const sizeConfig = sizeStyles[actualSize];
  

  // Enhanced interactive and state styles
  const isInteractive = interactive || !!onClick;
  
  const stateStyles = [
    // Base transition
    'transition-all duration-300 ease-out',
    
    // Loading state
    loading && 'animate-pulse pointer-events-none',
    
    // Disabled state
    disabled && 'opacity-50 pointer-events-none grayscale',
    
    // Interactive states
    isInteractive && !disabled && !loading && [
      'cursor-pointer',
      'hover:-translate-y-1',
      'hover:scale-[1.02]',
      'active:scale-[0.98]',
      'active:translate-y-0',
      hoverElevationStyles[elevation],
    ].filter(Boolean).join(' '),
    
    // Focus states for accessibility
    isInteractive && 'focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:ring-offset-2',
    
    // Glassmorphism effect
    glassmorphism && 'backdrop-blur-lg bg-white/70 border-white/20',
    
    // Gradient background
    gradient && 'bg-gradient-to-br from-neutral-50/30 via-white to-neutral-50/50',
  ].filter(Boolean).join(' ');

  // Combined classes for the main card using systematic foundation
  const cardClasses = cn(
    // Base foundation styles
    sizeConfig.borderRadius,
    'relative overflow-hidden',
    
    // Elevation and borders
    elevationStyles[elevation],
    borderStyles[border],
    
    // Variant styles
    !glassmorphism && variantStyles[variant],
    
    // State and interaction styles
    stateStyles,
    
    // Custom className
    className
  );

  // Specialized content renderers using unified layout system
  const renderMetricContent = () => {
    if (!metricData) return null;
    return <MetricContent data={metricData} fillHeight />;
  };

  const renderActionList = () => {
    if (!actions) return null;
    return <ActionListContent actions={actions} fillHeight />;
  };

  const renderActivityFeed = () => {
    if (!activities) return null;
    return <ActivityFeedContent activities={activities} fillHeight />;
  };

  // Handle loading skeleton
  if (loading) {
    return (
      <ShadcnCard className={cardClasses}>
        <div className="animate-pulse">
          {(title || subtitle || icon || badge) && (
            <div className={cn(
              `${sizeConfig.padding.x} ${sizeConfig.padding.y} border-b border-neutral-200/60 flex items-center justify-between`,
              headerClassName
            )}>
              <div className="flex items-center gap-3 min-w-0">
                {icon && <div className={`${iconSizes[sizeConfig.iconSize]} bg-neutral-200 rounded`}></div>}
                <div className="min-w-0 flex flex-col gap-1">
                  {title && <div className="h-6 bg-neutral-200 rounded w-32"></div>}
                  {subtitle && <div className="h-4 bg-neutral-200 rounded w-48"></div>}
                </div>
              </div>
              {badge && <div className={`${iconSizes[sizeConfig.iconSize]} bg-neutral-200 rounded`}></div>}
            </div>
          )}
          <CardContent className={cn(`${sizeConfig.padding.x} ${sizeConfig.padding.y}`, bodyClassName)}>
            <div className="space-y-4">
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
              <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </div>
      </ShadcnCard>
    );
  }

  // Enhanced render with new features
  return (
    <ShadcnCard 
      className={cardClasses} 
      onClick={disabled ? undefined : onClick}
      onMouseEnter={onHover}
    >
      {/* Custom header - direct layout */}
      {(title || subtitle || icon || badge) && (
        <div className={cn(
          "px-content-comfortable py-content-normal border-b border-neutral-200/60 flex items-center justify-between",
          headerClassName
        )}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className={`flex-shrink-0 ${iconSizes.lg} inline-flex items-center justify-center`}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center">
                {typeof title === 'string' ? (
                  <Typography variant="h3" weight="medium" className="leading-tight truncate m-0">{title}</Typography>
                ) : (
                  <div className="leading-tight truncate">{title}</div>
                )}
              </div>
              {subtitle && (
                <Typography variant="caption" color="medium" className="truncate mt-1">{subtitle}</Typography>
              )}
            </div>
          </div>
          {badge && (
            <div className="flex-shrink-0">
              {badge}
            </div>
          )}
        </div>
      )}
      
      {/* Content area with systematic foundation */}
      <CardContent className={cn(`${sizeConfig.padding.x} ${sizeConfig.padding.y}`, bodyClassName)}>
        {variant === 'metric' && metricData ? renderMetricContent() : 
         variant === 'action-list' && actions ? renderActionList() :
         variant === 'activity-feed' && activities ? renderActivityFeed() :
         children}
      </CardContent>
      
      {/* Footer with systematic foundation styling */}
      {footer && (
        <CardFooter className={cn(
          `${sizeConfig.padding.x} ${sizeConfig.padding.y}`,
          'bg-neutral-50/50 border-t border-neutral-200/60',
          footerClassName
        )}>
          {footer}
        </CardFooter>
      )}
      
      {/* Subtle shine effect for interactive cards */}
      {isInteractive && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
      )}
    </ShadcnCard>
  );
};

export default Card;
export type { MetricData, ActionItem, ActivityItem };