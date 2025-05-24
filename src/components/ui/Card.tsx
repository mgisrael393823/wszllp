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
  
  // Base spacing scale (4px grid system)
  const spacingScale = {
    xs: { gap: 'gap-1', space: 'space-y-1' },     // 4px
    sm: { gap: 'gap-2', space: 'space-y-2' },     // 8px  
    md: { gap: 'gap-3', space: 'space-y-3' },     // 12px
    lg: { gap: 'gap-4', space: 'space-y-4' },     // 16px
    xl: { gap: 'gap-6', space: 'space-y-6' },     // 24px
  };

  // Systematic icon sizing
  const iconSizes = {
    sm: 'w-4 h-4',   // 16px - for inline/secondary icons
    md: 'w-5 h-5',   // 20px - for standard UI icons  
    lg: 'w-6 h-6',   // 24px - for primary/header icons
  };

  // Systematic icon container sizing
  const iconContainerSizes = {
    sm: 'w-8 h-8',   // 32px container
    md: 'w-10 h-10', // 40px container
    lg: 'w-12 h-12', // 48px container
    xl: 'w-16 h-16', // 64px container for empty states
  };

  // Systematic skeleton loading widths
  const skeletonWidths = {
    title: 'w-32',     // Title skeleton
    subtitle: 'w-48',  // Subtitle skeleton  
    full: 'w-full',    // Full width line
    large: 'w-2/3',    // Large content line
    medium: 'w-1/2',   // Medium content line
  };

  // Systematic progress bar dimensions
  const progressBarSizes = {
    width: 'w-full',
    height: 'h-2',
    fill: 'h-full',
  };

  // Size system with consistent spacing tokens
  const sizeStyles: Record<CardSize, { 
    padding: { x: string; y: string }; 
    borderRadius: string;
    iconSize: keyof typeof iconSizes;
    gap: keyof typeof spacingScale;
  }> = {
    compact: {
      padding: { x: 'px-4', y: 'py-3' },
      borderRadius: 'rounded-lg',
      iconSize: 'sm',
      gap: 'sm',
    },
    normal: {
      padding: { x: 'px-6', y: 'py-4' },
      borderRadius: 'rounded-xl', 
      iconSize: 'md',
      gap: 'md',
    },
    spacious: {
      padding: { x: 'px-8', y: 'py-6' },
      borderRadius: 'rounded-xl',
      iconSize: 'lg', 
      gap: 'lg',
    },
    featured: {
      padding: { x: 'px-10', y: 'py-8' },
      borderRadius: 'rounded-2xl',
      iconSize: 'lg',
      gap: 'xl',
    },
  };
  
  const sizeConfig = sizeStyles[actualSize];
  
  // Base flex layout patterns  
  const flexPatterns = {
    headerRow: `flex items-center justify-between`,
    contentColumn: `flex flex-col space-y-4`,
    iconText: `flex items-center gap-3`,
    buttonRow: `flex items-center gap-3`,
    centered: `flex items-center justify-center`,
    spaceBetween: `flex justify-between`,
  };

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

  // Specialized content renderers
  const renderMetricContent = () => {
    if (!metricData) return null;
    
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
        <div className={spacingScale.sm.space}>
          <div className={`${progressBarSizes.width} bg-neutral-200 rounded-full ${progressBarSizes.height} overflow-hidden`}>
            <div 
              className={`${progressBarSizes.fill} ${progressStyles[progressVariant as keyof typeof progressStyles]} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className={`${flexPatterns.spaceBetween} text-sm text-neutral-600`}>
            <span>{current}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <div className="text-3xl font-bold text-neutral-900">
          <AnimatedCounter value={metricData.value} />
        </div>
        
        {metricData.progress && (
          <ProgressBar 
            current={metricData.progress.current}
            max={metricData.progress.max}
            variant={metricData.progress.variant}
          />
        )}
        
        {metricData.trend && (
          <div className={`flex items-center gap-2 ${metricData.trend.color}`}>
            <span className="w-4 h-4 flex-shrink-0">{metricData.trend.icon}</span>
            <span className="text-sm font-medium">{metricData.trend.label}</span>
          </div>
        )}
        
        <p className="text-sm text-neutral-600">
          {metricData.subtitle}
        </p>
      </div>
    );
  };

  const renderActionList = () => {
    if (!actions) return null;

    const actionVariantStyles = {
      primary: 'hover:border-primary-300 hover:bg-primary-50/50 text-primary-600',
      success: 'hover:border-success-300 hover:bg-success-50/50 text-success-600',
      accent: 'hover:border-accent-300 hover:bg-accent-50/50 text-accent-600',
      secondary: 'hover:border-secondary-300 hover:bg-secondary-50/50 text-secondary-600',
    };

    return (
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 
              transition-all group
              ${actionVariantStyles[action.variant || 'primary']}
            `}
          >
            <span className="w-5 h-5 group-hover:scale-110 transition-transform">
              {action.icon}
            </span>
            <span className="font-medium text-neutral-900">{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderActivityFeed = () => {
    if (!activities) return null;

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
        <button
          onClick={activity.onClick}
          className={`
            w-full flex items-start gap-4 p-4 rounded-xl border bg-white
            ${styles.border} ${styles.hover}
            hover:shadow-sm hover:-translate-y-0.5
            active:translate-y-0 active:scale-[0.98]
            transition-all duration-200 ease-out
            cursor-pointer group text-left
          `}
        >
          <div className={`
            flex-shrink-0 ${iconContainerSizes.md} rounded-lg ${flexPatterns.centered}
            ${styles.icon}
            group-hover:scale-110 transition-transform duration-200
          `}>
            <span className={iconSizes.sm}>{activity.icon}</span>
          </div>
          
          <div className={`flex-1 min-w-0 ${flexPatterns.contentColumn}`}>
            <h4 className="font-semibold text-neutral-900 truncate group-hover:text-neutral-800">
              {activity.title}
            </h4>
            <p className="text-sm text-neutral-600 line-clamp-2 group-hover:text-neutral-700">
              {activity.description}
            </p>
            <p className="text-xs text-neutral-500 font-medium">
              {activity.timestamp}
            </p>
          </div>
          
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg className={`${iconSizes.sm} text-neutral-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      );
    };

    if (activities.length === 0) {
      return (
        <div className={`text-center ${sizeConfig.padding.y} text-neutral-500 ${flexPatterns.contentColumn} items-center`}>
          <div className={`${iconContainerSizes.xl} rounded-full bg-neutral-100 ${flexPatterns.centered}`}>
            <svg className={`${iconSizes.lg} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-medium text-neutral-900">No recent activity</h3>
          <p className="text-sm">Activity will appear here as you use the system</p>
        </div>
      );
    }

    return (
      <div className={`${flexPatterns.contentColumn} max-h-80 overflow-y-auto`}>
        {activities.map((activity) => (
          <ActivityButton key={activity.id} activity={activity} />
        ))}
      </div>
    );
  };

  // Handle loading skeleton
  if (loading) {
    return (
      <ShadcnCard className={cardClasses}>
        <div className="animate-pulse">
          {(title || subtitle || icon || badge) && (
            <div className={cn(
              `${sizeConfig.padding.x} ${sizeConfig.padding.y} border-b border-neutral-200/60`,
              flexPatterns.headerRow,
              headerClassName
            )}>
              <div className={`${flexPatterns.iconText} min-w-0`}>
                {icon && <div className={`${iconSizes[sizeConfig.iconSize]} bg-neutral-200 rounded`}></div>}
                <div className="min-w-0 flex flex-col gap-1">
                  {title && <div className={`h-6 bg-neutral-200 rounded ${skeletonWidths.title}`}></div>}
                  {subtitle && <div className={`h-4 bg-neutral-200 rounded ${skeletonWidths.subtitle}`}></div>}
                </div>
              </div>
              {badge && <div className={`${iconSizes[sizeConfig.iconSize]} bg-neutral-200 rounded`}></div>}
            </div>
          )}
          <CardContent className={cn(`${sizeConfig.padding.x} ${sizeConfig.padding.y}`, bodyClassName)}>
            <div className={spacingScale[sizeConfig.gap].space}>
              <div className={`h-4 bg-neutral-200 rounded ${skeletonWidths.full}`}></div>
              <div className={`h-4 bg-neutral-200 rounded ${skeletonWidths.large}`}></div>
              <div className={`h-4 bg-neutral-200 rounded ${skeletonWidths.medium}`}></div>
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
          "px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between",
          headerClassName
        )}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="flex-shrink-0 w-6 h-6 inline-flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {typeof title === 'string' ? (
                <h3 className="text-lg font-medium leading-none tracking-tight truncate align-middle inline-flex items-center">{title}</h3>
              ) : (
                <div className="align-middle leading-none inline-flex items-center">{title}</div>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate mt-1">{subtitle}</p>
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