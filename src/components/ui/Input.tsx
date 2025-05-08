import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, fullWidth = true, className = '', ...props }, ref) => {
    const inputClasses = `
      block rounded-md shadow-sm border ${error ? 'border-error-500' : 'border-gray-300'} 
      focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50
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
        <input ref={ref} className={inputClasses} {...props} />
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

Input.displayName = 'Input';

export default Input;