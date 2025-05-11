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
const Button: React.FC<ButtonProps> = ({
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
}) => {
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

  // Map the elevation to Tailwind shadow classes
  const shadowClasses: Record<ButtonElevation, string> = {
    none: '',
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
  };

  // Combine with full width class if needed
  const combinedClassName = `${shadowClasses[elevation]} ${fullWidth ? 'w-full' : ''} ${className}`;

  // Process icon to prevent nested button issues
  const safeIcon = icon && React.isValidElement(icon) 
    ? React.cloneElement(icon, { 
        role: 'presentation',
        ['aria-hidden']: true
      }) 
    : icon;

  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={combinedClassName}
      disabled={disabled || loading}
      loading={loading}
      asChild={asChild}
      {...props}
    >
      <>
        {safeIcon && <span className={`${children ? 'mr-2' : ''}`}>{safeIcon}</span>}
        {children}
      </>
    </ShadcnButton>
  );
};

export default Button;