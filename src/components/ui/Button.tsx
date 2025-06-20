import React from 'react';
import { Button as ShadcnButton } from './shadcn-button';
import type { ButtonProps as ShadcnButtonProps } from './shadcn-button';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'text' | 'accent';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonElevation = 'none' | 'low' | 'medium' | 'high';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  elevation?: ButtonElevation;
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

/**
 * Button component that uses Shadcn UI Button internally but maintains the original API
 * This ensures backward compatibility with existing code
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  elevation = 'none',
  children,
  icon,
  fullWidth = false,
  loading = false,
  className = '',
  disabled = false,
  asChild = false,
  ...props
}, ref) => {
  // Map the original variants to Shadcn UI variants
  const variantMap: Record<ButtonVariant, ShadcnButtonProps['variant']> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    danger: 'destructive',
    success: 'success',
    text: 'link',
    accent: 'ghost',
  };

  // Map the original sizes to Shadcn UI sizes
  const sizeMap: Record<ButtonSize, ShadcnButtonProps['size']> = {
    xs: 'xs',
    sm: 'sm',
    md: 'default',
    lg: 'lg',
  };

  // Map the elevation to enhanced shadow classes with hover states
  const shadowClasses: Record<ButtonElevation, string> = {
    none: 'hover:shadow-md active:shadow-sm',
    low: 'shadow-sm hover:shadow-lg active:shadow-md',
    medium: 'shadow-md hover:shadow-xl active:shadow-lg',
    high: 'shadow-lg hover:shadow-2xl active:shadow-xl',
  };

  // Combine with enhanced interaction classes
  const combinedClassName = `
    ${shadowClasses[elevation]} 
    ${fullWidth ? 'w-full' : ''} 
    transition-all duration-200 ease-out
    hover:scale-[1.02] hover:-translate-y-0.5
    active:scale-[0.98] active:translate-y-0
    disabled:hover:scale-100 disabled:hover:translate-y-0
    ${className}
  `;

  // Process icon to prevent nested button issues
  const safeIcon = icon && React.isValidElement(icon) 
    ? React.cloneElement(icon, { 
        role: 'presentation',
        ['aria-hidden']: true
      }) 
    : icon;

  return (
    <ShadcnButton
      ref={ref}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={combinedClassName}
      disabled={disabled || loading}
      loading={loading}
      asChild={asChild}
      {...props}
    >
      <>
        {safeIcon && <span className={`${children ? 'mr-2' : ''} transition-transform group-hover:scale-110`}>{safeIcon}</span>}
        {children}
      </>
    </ShadcnButton>
  );
});

Button.displayName = 'Button';

export default Button;