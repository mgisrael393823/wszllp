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

type CardElevation = 'flat' | 'low' | 'medium' | 'high';
type CardBorder = 'none' | 'light' | 'normal' | 'accent';
type CardVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning';

interface CardProps {
  children: React.ReactNode;
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
  compact?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Card component that uses Shadcn UI Card internally but maintains the original API
 * This ensures backward compatibility with existing code
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
  compact = false,
  onClick,
}) => {
  // Elevation styles using the shadow system
  const elevationStyles: Record<CardElevation, string> = {
    flat: '',
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
  };

  // Border styles
  const borderStyles: Record<CardBorder, string> = {
    none: 'border-0',
    light: 'border border-neutral-200',
    normal: 'border border-neutral-300',
    accent: 'border border-primary-200',
  };

  // Card variant styles
  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white',
    primary: 'bg-primary-50 border-primary-200',
    secondary: 'bg-secondary-50 border-secondary-200',
    accent: 'bg-accent-50 border-accent-200',
    success: 'bg-success-50 border-success-200',
    error: 'bg-error-50 border-error-200',
    warning: 'bg-warning-50 border-warning-200',
  };

  // Standardized padding based on 4px scale
  const paddingSize = compact ? {
    x: 'px-4', // 16px horizontal
    y: 'py-3'   // 12px vertical
  } : {
    x: 'px-6', // 24px horizontal
    y: 'py-4'   // 16px vertical
  };

  // Interactive effect if onClick is provided
  const interactiveStyles = onClick ? 'cursor-pointer transition-all duration-150 hover:shadow-md' : '';

  // Combined classes for the main card
  const cardClasses = cn(
    elevationStyles[elevation],
    borderStyles[border],
    variantStyles[variant],
    interactiveStyles,
    className
  );

  // Render with Shadcn Components
  return (
    <ShadcnCard className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <CardHeader className={cn(`${paddingSize.x} ${paddingSize.y} border-b border-neutral-200`, headerClassName)}>
          {typeof title === 'string' ? (
            <CardTitle>{title}</CardTitle>
          ) : (
            title
          )}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent className={cn(`${paddingSize.x} ${paddingSize.y}`, bodyClassName)}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className={cn(`${paddingSize.x} ${paddingSize.y} bg-neutral-50 border-t border-neutral-200`, footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </ShadcnCard>
  );
};

export default Card;