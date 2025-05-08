import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    options, 
    error, 
    hint, 
    fullWidth = true, 
    size = 'md',
    className = '', 
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'py-1 text-sm',
      md: 'py-2 text-base',
      lg: 'py-3 text-lg',
    };

    const selectClasses = `
      block rounded-md shadow-sm border ${error ? 'border-error-500' : 'border-gray-300'} 
      focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50
      px-3 ${sizeClasses[size]}
      ${fullWidth ? 'w-full' : 'w-auto'}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'} mb-4`}>
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <select ref={ref} className={selectClasses} {...props}>
          {!props.required && (
            <option value="">Select an option</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-error-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;