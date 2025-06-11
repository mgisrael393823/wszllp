import React from 'react';
import { Column } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import Input from '../Input';

interface TextFilterProps<TData> {
  column: Column<TData, unknown>;
  placeholder?: string;
}

export function TextFilter<TData>({ column, placeholder }: TextFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();

  return (
    <Input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={placeholder ?? `Search ${column.id}...`}
      leftIcon={<Search className="h-4 w-4" />}
      rightIcon={columnFilterValue && (
        <button
          onClick={() => column.setFilterValue('')}
          className="hover:text-neutral-600 transition-colors"
          data-testid={`clear-filter-${column.id}`}
          aria-label={`Clear ${column.id} filter`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      className="mb-0"
      size="sm"
      data-testid={`text-filter-${column.id}`}
      aria-label={`Filter ${column.id}`}
    />
  );
}