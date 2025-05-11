import React from 'react';

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
}

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
  ...props
}) => {
  // Base styles applying to all buttons
  const baseStyle = 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant styles with consistent patterns
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 focus:ring-secondary-500',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 focus:ring-accent-400',
    outline: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 focus:ring-primary-500',
    danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus:ring-error-500',
    success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500',
    text: 'bg-transparent text-primary-600 hover:text-primary-800 hover:bg-neutral-50 active:bg-neutral-100 focus:ring-primary-500',
  };
  
  // Size styles with standardized padding based on 4px scale
  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'text-xs px-2 py-1 rounded',       // 8px horizontal, 4px vertical
    sm: 'text-sm px-3 py-2 rounded-md',    // 12px horizontal, 8px vertical
    md: 'text-sm px-4 py-2 rounded-md',    // 16px horizontal, 8px vertical
    lg: 'text-base px-6 py-3 rounded-lg',  // 24px horizontal, 12px vertical
  };
  
  // Elevation styles (shadows)
  const elevationStyles: Record<ButtonElevation, string> = {
    none: '',
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
  };
  
  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // Loading state
  const loadingClass = loading ? 'relative text-transparent transition-none pointer-events-none' : '';
  
  // Combine all styles
  const buttonStyle = `${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${elevationStyles[elevation]} ${widthStyle} ${loadingClass} ${className}`;
  
  return (
    <button 
      className={buttonStyle} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;