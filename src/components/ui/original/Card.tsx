import React from 'react';

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
  const paddingStyles = compact ? {
    header: 'px-4 py-3', // 16px horizontal, 12px vertical
    body: 'px-4 py-3',   // 16px horizontal, 12px vertical
    footer: 'px-4 py-3'  // 16px horizontal, 12px vertical
  } : {
    header: 'px-6 py-4', // 24px horizontal, 16px vertical
    body: 'px-6 py-4',   // 24px horizontal, 16px vertical
    footer: 'px-6 py-4'  // 24px horizontal, 16px vertical
  };

  // Interactive effect if onClick is provided
  const interactiveStyles = onClick ? 'cursor-pointer transition-all duration-150 hover:shadow-md' : '';

  return (
    <div 
      className={`rounded-lg overflow-hidden ${elevationStyles[elevation]} ${borderStyles[border]} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className={`${paddingStyles.header} border-b border-neutral-200 ${headerClassName}`}>
          {typeof title === 'string' ? (
            <h3 className="text-lg font-medium text-neutral-800">{title}</h3>
          ) : (
            title
          )}
          {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={`${paddingStyles.body} ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className={`${paddingStyles.footer} bg-neutral-50 border-t border-neutral-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;