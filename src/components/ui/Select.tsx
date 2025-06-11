import React, { forwardRef, useId } from 'react';
import { 
  Select as ShadcnSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel
} from './shadcn-select';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectSize = 'sm' | 'md' | 'lg';
type SelectVariant = 'default' | 'filled' | 'outlined' | 'unstyled';
type SelectState = 'default' | 'error' | 'success' | 'warning';
type SelectGroup = { label: string; options: SelectOption[] };

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  label?: string;
  options?: SelectOption[] | SelectGroup[]; // Make options optional
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
  onChange?: (value: string) => void;
}

/**
 * Select component that uses Shadcn UI Select internally but maintains the original API
 * This ensures backward compatibility with existing code
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ 
  label, 
  options = [], // Default to empty array
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
  rightIcon,
  required = false, 
  fullWidth = true,
  placeholder = "Select an option",
  grouped = false,
  onChange,
  value,
  disabled = false,
  ...props 
}, ref) => {
  // Generate a unique ID for the select and label
  const uniqueId = useId();
  const id = props.id || uniqueId;
  
  
  // Determine the active state (error takes precedence over warning and success)
  const activeState = error ? 'error' : warning ? 'warning' : success ? 'success' : state;
  
  // Size variants
  const sizeStyles: Record<SelectSize, string> = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };
  
  // Input variant styles
  const variantStyles: Record<SelectVariant, string> = {
    default: '',
    filled: 'bg-neutral-100 border-transparent focus-within:bg-white focus-within:border-neutral-300',
    outlined: 'border-2',
    unstyled: 'border-0 shadow-none',
  };
  
  // State styles
  const stateStyles: Record<SelectState, string> = {
    default: '',
    error: 'border-error-500 focus-within:ring-error-500',
    success: 'border-success-500 focus-within:ring-success-500',
    warning: 'border-warning-500 focus-within:ring-warning-500',
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
  
  // Required indicator
  const requiredIndicator = required ? 'after:content-["*"] after:ml-0.5 after:text-error-500' : '';
  
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
    return grouped || (
      Array.isArray(opts) && 
      opts.length > 0 && 
      opts[0] !== undefined && 
      'label' in opts[0] && 
      'options' in opts[0]
    );
  };
  
  // Handle value change
  const handleValueChange = (newValue: string) => {
    // Convert "_empty" placeholder value to empty string for backward compatibility
    const finalValue = newValue === "_empty" ? "" : newValue;

    // Avoid triggering parent state updates if the value hasn't actually changed
    if (onChange && finalValue !== value) {
      onChange(finalValue);
    }
  };
  
  return (
    <div className={cn(widthStyle, 'mb-4', className)}>
      {label && (
        <label 
          htmlFor={id}
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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-neutral-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <ShadcnSelect
          value={!value || value === "" ? "_empty" : value}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger 
            id={id}
            className={cn(
              sizeStyles[size],
              variantStyles[variant],
              stateStyles[activeState],
              leftIcon && 'pl-9',
              selectClassName
            )}
            aria-invalid={!!error}
            aria-describedby={message ? `${id}-message` : undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          
          <SelectContent>
            {!required && (
              <SelectItem key="placeholder" value="_empty">
                {placeholder}
              </SelectItem>
            )}
            
            {Array.isArray(options) && options.length > 0 ? (
              hasGroups(options) ? (
                // Render option groups
                (options as SelectGroup[]).map((group, groupIndex) => (
                  group && group.label ? (
                    <SelectGroup key={group.label || `group-${groupIndex}` }>
                      <SelectLabel>{group.label || 'Options'}</SelectLabel>
                      {Array.isArray(group.options) && group.options.map((option, index) => {
                        // Skip invalid options
                        if (!option || option.value === undefined) return null;

                        const valueKey = option.value || `_empty_group_${groupIndex}_${index}`;

                        return (
                          <SelectItem
                            key={valueKey}
                            value={option.value || `_empty_group_${groupIndex}_${index}`}
                            disabled={option.disabled}
                          >
                            {option.label || option.value}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  ) : null
                ))
              ) : (
                // Render flat options
                (options as SelectOption[]).map((option, index) => {
                  // Skip invalid options
                  if (!option || option.value === undefined) return null;

                  const valueKey = option.value || `_empty_${index}`;

                  return (
                    <SelectItem
                      key={valueKey}
                      value={option.value || `_empty_${index}`}
                      disabled={option.disabled}
                    >
                      {option.label || option.value}
                    </SelectItem>
                  );
                })
              )
            ) : (
              // Fallback when no options provided
              <SelectItem key="no-options" value="_empty" disabled>
                No options available
              </SelectItem>
            )}
          </SelectContent>
        </ShadcnSelect>
        
        {message && (
          <p 
            id={`${id}-message`}
            className={cn('mt-1 text-sm', messageStyles[activeState])}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;