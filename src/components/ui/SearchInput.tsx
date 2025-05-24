import React from 'react';
import { Search, X } from 'lucide-react';
import Input from './Input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  
  // Size variants for different contexts
  size?: 'sm' | 'md' | 'lg';
  
  // Whether to show clear button
  clearable?: boolean;
  
  // Debounce delay in ms (0 for no debounce)
  debounceDelay?: number;
  
  // Additional props
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Standardized SearchInput component with consistent sizing, icon positioning, and behavior
 * Eliminates inconsistent search input implementations across components
 */
const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = '',
  size = 'md',
  clearable = true,
  debounceDelay = 0,
  disabled = false,
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout>();
  
  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle input change with optional debouncing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (debounceDelay > 0) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceDelay);
    } else {
      // No debounce, call immediately
      onChange(newValue);
    }
  };
  
  // Handle clear
  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`filter-search ${className}`}
      size={size}
      disabled={disabled}
      autoFocus={autoFocus}
      leftIcon={<Search className="icon-standard" />}
      rightIcon={
        clearable && localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="icon-standard" />
          </button>
        ) : undefined
      }
    />
  );
};

export default SearchInput;
