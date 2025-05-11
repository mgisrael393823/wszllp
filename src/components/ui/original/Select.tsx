import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectSize = 'sm' | 'md' | 'lg';
type SelectVariant = 'default' | 'filled' | 'outlined' | 'unstyled';
type SelectState = 'default' | 'error' | 'success' | 'warning';
type SelectGroup = { label: string; options: SelectOption[] };

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[] | SelectGroup[];
  error?: string;
  success?: string;
  warning?: string;
  hint?: string;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
  size?: SelectSize;
  variant?: SelectVariant;
  state?: SelectState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  grouped?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    options, 
    error, 
    success,
    warning,
    hint, 
    className = '',
    selectClassName = '',
    labelClassName = '',
    size = 'md',
    variant = 'default',
    state = 'default',
    leftIcon,
    rightIcon = (
      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    required = false, 
    fullWidth = true,
    placeholder = "Select an option",
    grouped = false,
    disabled = false,
    ...props 
  }, ref) => {
    // Determine the active state (error takes precedence over warning and success)
    const activeState = error ? 'error' : warning ? 'warning' : success ? 'success' : state;

    // Size variants
    const sizeStyles: Record<SelectSize, string> = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    // Select variant styles
    const variantStyles: Record<SelectVariant, string> = {
      default: 'border border-neutral-300 rounded-md shadow-sm bg-white',
      filled: 'border border-transparent rounded-md bg-neutral-100 focus:bg-white focus:border-neutral-300',
      outlined: 'border-2 border-neutral-300 rounded-md bg-transparent',
      unstyled: 'border-0 bg-transparent shadow-none',
    };

    // State styles
    const stateStyles: Record<SelectState, string> = {
      default: 'focus:ring-primary-500 focus:border-primary-500',
      error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
      warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500',
    };

    // Message styles
    const messageStyles: Record<SelectState, string> = {
      default: 'text-neutral-500',
      error: 'text-error-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
    };

    // Width style
    const widthStyle = fullWidth ? 'w-full' : 'w-auto';

    // Label styles
    const labelStyle = `block text-sm font-medium text-neutral-700 mb-1 ${labelClassName}`;

    // Select wrapper styles
    const selectWrapperStyle = `relative ${widthStyle}`;

    // Disabled styles
    const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

    // Icon padding adjustments
    const iconPaddingLeft = leftIcon ? 'pl-9' : '';
    const iconPaddingRight = rightIcon ? 'pr-9' : ''; // Always has right icon (dropdown arrow)

    // Required indicator
    const requiredIndicator = required ? 'after:content-["*"] after:ml-0.5 after:text-error-500' : '';

    // Combine base select styles
    const selectStyle = `
      appearance-none block
      ${widthStyle}
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      ${stateStyles[activeState]}
      ${disabledStyle}
      ${iconPaddingLeft}
      ${iconPaddingRight}
      placeholder-neutral-400
      focus:outline-none focus:ring focus:ring-opacity-50
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
      ${selectClassName}
    `;

    // Get message text based on state
    const getMessage = () => {
      if (error) return error;
      if (warning) return warning;
      if (success) return success;
      if (hint) return hint;
      return null;
    };

    const message = getMessage();

    // Helper to determine if the options array contains option groups
    const hasGroups = (opts: SelectOption[] | SelectGroup[]): opts is SelectGroup[] => {
      return grouped || (opts.length > 0 && 'label' in opts[0] && 'options' in opts[0]);
    };

    return (
      <div className={`${widthStyle} mb-4 ${className}`}>
        {label && (
          <label 
            htmlFor={props.id}
            className={`${labelStyle} ${requiredIndicator}`}
          >
            {label}
          </label>
        )}
        <div className={selectWrapperStyle}>
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            className={selectStyle}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={message ? `${props.id}-message` : undefined}
            {...props}
          >
            {!props.required && (
              <option value="" disabled={props.value !== undefined && props.value !== ''}>
                {placeholder}
              </option>
            )}
            
            {hasGroups(options) ? (
              // Render option groups
              (options as SelectGroup[]).map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))
            ) : (
              // Render flat options
              (options as SelectOption[]).map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>
        {message && (
          <p 
            id={props.id ? `${props.id}-message` : undefined}
            className={`mt-1 text-sm ${messageStyles[activeState]}`}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;