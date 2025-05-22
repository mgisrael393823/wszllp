import React, { forwardRef } from 'react';
import { Input as ShadcnInput } from './shadcn-input';
import { cn } from '@/lib/utils';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled' | 'outlined' | 'unstyled';
type InputState = 'default' | 'error' | 'success' | 'warning';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  hint?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  size?: InputSize;
  variant?: InputVariant;
  state?: InputState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  fullWidth?: boolean;
}

/**
 * Input component that uses Shadcn UI Input internally but maintains the original API
 * This ensures backward compatibility with existing code
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  warning,
  hint,
  className = '',
  inputClassName = '',
  labelClassName = '',
  size = 'md',
  variant = 'default',
  state = 'default',
  leftIcon,
  rightIcon,
  required = false,
  fullWidth = true,
  disabled = false,
  ...props
}, ref) => {
  // Determine the active state (error takes precedence over warning and success)
  const activeState = error ? 'error' : warning ? 'warning' : success ? 'success' : state;

  // Size variants
  const sizeStyles: Record<InputSize, string> = {
    sm: 'h-8 px-2 py-1 text-xs',
    md: 'h-10 px-3 py-2 text-sm',
    lg: 'h-12 px-4 py-3 text-base',
  };

  // Input variant styles
  const variantStyles: Record<InputVariant, string> = {
    default: '',
    filled: 'bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-300',
    outlined: 'border-2',
    unstyled: 'border-0 shadow-none',
  };

  // State styles
  const stateStyles: Record<InputState, string> = {
    default: '',
    error: 'border-error-500 focus-visible:ring-error-500',
    success: 'border-success-500 focus-visible:ring-success-500',
    warning: 'border-warning-500 focus-visible:ring-warning-500',
  };

  // Message styles
  const messageStyles: Record<InputState, string> = {
    default: 'text-neutral-500',
    error: 'text-error-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
  };

  // Width style
  const widthStyle = fullWidth ? 'w-full' : 'w-auto';

  // Required indicator
  const requiredIndicator = required ? 'after:content-["*"] after:ml-0.5 after:text-error-500' : '';

  // Combined input styles
  const combinedInputClassName = cn(
    sizeStyles[size],
    variantStyles[variant],
    stateStyles[activeState],
    inputClassName
  );

  // Get message text based on state
  const getMessage = () => {
    if (error) return error;
    if (warning) return warning;
    if (success) return success;
    if (hint) return hint;
    return null;
  };

  const message = getMessage();

  return (
    <div className={cn(widthStyle, 'mb-4', className)}>
      {label && (
        <label 
          htmlFor={props.id}
          className={cn(
            'block text-sm font-medium text-neutral-700 mb-1',
            requiredIndicator,
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <div className={cn('relative', widthStyle)}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
            {leftIcon}
          </div>
        )}
        <ShadcnInput
          ref={ref}
          className={cn(
            combinedInputClassName,
            leftIcon && 'pl-9',
            rightIcon && 'pr-9'
          )}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={message ? `${props.id}-message` : undefined}
          {...props}
          onChange={props.onChange}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
            {rightIcon}
          </div>
        )}
      </div>
      {message && (
        <p 
          id={props.id ? `${props.id}-message` : undefined}
          className={cn('mt-1 text-sm', messageStyles[activeState])}
        >
          {message}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;