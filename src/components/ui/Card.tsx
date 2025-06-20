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
import Typography from './Typography';
import { CardProvider, cardSizeConfig, type CardSize as CardSizeType } from './CardContext';

type CardElevation = 'flat' | 'low' | 'medium' | 'high' | 'extreme';
type CardBorder = 'none' | 'light' | 'normal' | 'accent' | 'gradient';
type CardVariant = 'default' | 'primary' | 'accent' | 'bordered' | 'elevated';
type CardSize = CardSizeType; // Use the type from CardContext


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
}

/**
 * @deprecated This Card component is deprecated and will be removed in v2.0.
 * Please use one of the new focused components instead:
 * - MetricCard: For KPIs and statistics
 * - StatusCard: For entities with workflow states  
 * - ActionListCard: For lists of clickable items
 * 
 * See CARD_MIGRATION_GUIDE.md for migration instructions.
 * 
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
}) => {
  // Deprecation warnings
  React.useEffect(() => {
    console.warn(
      'Card: This component is deprecated and will be removed in v2.0. ' +
      'Please migrate to MetricCard, StatusCard, or ActionListCard. ' +
      'See src/components/ui/CARD_MIGRATION_GUIDE.md for details.'
    );
    
    if (compact !== undefined) {
      console.warn(
        'Card: The "compact" prop is deprecated and will be removed in v2.0. ' +
        'Please use size="compact" instead.'
      );
    }
  }, [compact]);

  // Enhanced elevation system with sophisticated shadows
  const elevationStyles: Record<CardElevation, string> = {
    flat: '',
    low: 'shadow-sm',
    medium: 'shadow-md hover:shadow-lg',
    high: 'shadow-lg hover:shadow-xl',
    extreme: 'shadow-2xl hover:shadow-2xl',
  };

  // Hover elevation effects with modern transitions
  const hoverElevationStyles: Record<CardElevation, string> = {
    flat: 'hover:shadow-md',
    low: 'hover:shadow-lg',
    medium: 'hover:shadow-xl',
    high: 'hover:shadow-2xl',
    extreme: 'hover:shadow-2xl',
  };

  // Enhanced border system with gradients
  const borderStyles: Record<CardBorder, string> = {
    none: 'border-0',
    light: 'border border-neutral-200/50 hover:border-neutral-300/70',
    normal: 'border border-neutral-300 hover:border-neutral-400',
    accent: 'border border-primary-200 hover:border-primary-300',
    gradient: 'border-2 border-transparent bg-gradient-to-r from-primary-200 via-accent-200 to-secondary-200 bg-clip-padding',
  };

  // Simplified variant system with subtle gradients
  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-gradient-to-br from-white to-neutral-50/20',
    primary: 'bg-gradient-to-br from-primary-50/60 to-primary-50/30 border-primary-200',
    accent: 'bg-gradient-to-br from-accent-50/60 to-accent-50/30 border-accent-200',
    bordered: 'bg-white border-2',
    elevated: 'bg-gradient-to-br from-white to-neutral-50/40 shadow-lg',
  };

  // Systematic foundation system
  const actualSize = compact ? 'compact' : size; // Handle deprecated compact prop
  
  // Get size configuration from context
  const sizeConfig = cardSizeConfig[actualSize];
  

  // Enhanced interactive and state styles
  const isInteractive = interactive || !!onClick;
  
  const stateStyles = [
    // Base transition with modern easing
    // eslint-disable-next-line no-useless-escape
    'transition-all duration-300 ease-\[cubic-bezier\(0.4,0,0.2,1\)\]',
    
    // Loading state
    loading && 'animate-pulse pointer-events-none',
    
    // Disabled state
    disabled && 'opacity-50 pointer-events-none grayscale',
    
    // Interactive states
    isInteractive && !disabled && !loading && [
      'cursor-pointer',
      'hover:-translate-y-1',
      'hover:scale-[1.01]',
      'active:scale-[0.99]',
      'active:translate-y-0',
      hoverElevationStyles[elevation],
    ].filter(Boolean).join(' '),
    
    // Focus states for accessibility
    isInteractive && 'focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:ring-offset-2',
    
    // Glassmorphism effect with modern styling
    glassmorphism && 'backdrop-blur-xl bg-white/60 border-white/30 shadow-xl',
    
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


  // Handle loading skeleton
  if (loading) {
    return (
      <CardProvider size={actualSize}>
        <ShadcnCard className={cardClasses}>
          <div>
          {(title || subtitle || icon || badge) && (
            <>
              <div className={cn(
                `${sizeConfig.padding.x} ${sizeConfig.padding.y} flex items-center justify-between`,
                headerClassName
              )}>
                <div className="flex items-start gap-3 min-w-0">
                  {icon && <div className={cn(
                    "flex-shrink-0 flex items-center justify-center",
                    sizeConfig.icon.containerPadding,
                    sizeConfig.icon.containerSize,
                    "bg-neutral-200 rounded-lg animate-pulse"
                  )}></div>}
                  <div className="min-w-0 flex flex-col gap-1">
                    {title && <div className="h-6 bg-neutral-200 rounded w-28 animate-pulse" style={{ animationDelay: '75ms' }}></div>}
                    {subtitle && <div className="h-4 bg-neutral-200 rounded w-44 animate-pulse" style={{ animationDelay: '150ms' }}></div>}
                  </div>
                </div>
                {badge && <div className="h-5 bg-neutral-200 rounded-full w-12 animate-pulse" style={{ animationDelay: '225ms' }}></div>}
              </div>
            </>
          )}
          <CardContent className={cn(
            sizeConfig.padding.x,
            "pt-3 pb-4",
            bodyClassName
          )}>
            <div className="space-y-3">
              <div className="h-4 bg-neutral-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-neutral-200 rounded w-5/6 animate-pulse" style={{ animationDelay: '100ms' }}></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" style={{ animationDelay: '200ms' }}></div>
            </div>
          </CardContent>
        </div>
      </ShadcnCard>
    </CardProvider>
    );
  }

  // Enhanced render with new features
  return (
    <CardProvider size={actualSize}>
      <ShadcnCard 
        className={cardClasses} 
        onClick={disabled ? undefined : onClick}
        onMouseEnter={onHover}
      >
      {/* Custom header - direct layout */}
      {(title || subtitle || icon || badge) && (
        <>
          <div className={cn(
            `${sizeConfig.padding.x} ${sizeConfig.padding.y} flex items-center justify-between`,
            headerClassName
          )}>
            <div className="flex items-start gap-3 min-w-0">
              {icon && (
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  sizeConfig.icon.containerPadding,
                  sizeConfig.icon.containerSize,
                  "bg-neutral-100 rounded-lg"
                )}>
                  <div className={sizeConfig.icon.size}>
                    {icon}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                {typeof title === 'string' ? (
                  <h3 className={cn(sizeConfig.typography.title, "text-neutral-900 m-0")}>{title}</h3>
                ) : (
                  <div className="text-neutral-900">{title}</div>
                )}
                {subtitle && (
                  <p className={cn(sizeConfig.typography.subtitle, "m-0")}>{subtitle}</p>
                )}
              </div>
            </div>
            {badge && (
              <div className="flex-shrink-0">
                {typeof badge === 'string' ? (
                  <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-md ring-1 ring-primary-200/50">
                    {badge}
                  </span>
                ) : (
                  badge
                )}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Content area with systematic foundation */}
      <CardContent className={cn(
        sizeConfig.padding.x,
        "pt-3 pb-4",
        "card-reset", 
        bodyClassName
      )}>
        {children}
      </CardContent>
      
      {/* Footer with systematic foundation styling */}
      {footer && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
          <CardFooter className={cn(
            `${sizeConfig.padding.x} ${sizeConfig.padding.y}`,
            'bg-neutral-50/50',
            footerClassName
          )}>
            {footer}
          </CardFooter>
        </>
      )}
      
      {/* Subtle shine effect for interactive cards */}
      {isInteractive && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none rounded-[inherit] overflow-hidden" />
      )}
      </ShadcnCard>
    </CardProvider>
  );
};

export default Card;