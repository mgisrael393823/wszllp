import React from 'react';
import { Column } from '@tanstack/react-table';
import Select from '../Select';

interface SelectFilterProps<TData> {
  column: Column<TData, unknown>;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectFilter<TData>({ column, options, placeholder }: SelectFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();

  return (
    <Select
      value={columnFilterValue?.toString() ?? ''}
      onChange={(value) => column.setFilterValue(value || undefined)}
      placeholder={placeholder ?? 'All'}
      options={[
        { value: '', label: 'All' },
        ...options
      ]}
      className="mb-0"
      size="sm"
      data-testid={`select-filter-${column.id}`}
      aria-label={`Filter ${column.id}`}
    />
  );
}