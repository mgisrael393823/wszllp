import React from 'react';
import { Column } from '@tanstack/react-table';
import { Calendar } from 'lucide-react';
import Input from '../Input';

interface DateRangeFilterProps<TData> {
  column: Column<TData, unknown>;
}

export function DateRangeFilter<TData>({ column }: DateRangeFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue() as [string, string] | undefined;

  return (
    <div className="flex gap-2" data-testid={`date-range-filter-${column.id}`}>
      <Input
        type="date"
        value={columnFilterValue?.[0] ?? ''}
        onChange={(e) =>
          column.setFilterValue((old: [string, string]) => [e.target.value, old?.[1] ?? ''])
        }
        leftIcon={<Calendar className="h-4 w-4" />}
        placeholder="From"
        className="mb-0 flex-1"
        size="sm"
        data-testid={`date-filter-start-${column.id}`}
        aria-label={`Start date for ${column.id} filter`}
      />
      <Input
        type="date"
        value={columnFilterValue?.[1] ?? ''}
        onChange={(e) =>
          column.setFilterValue((old: [string, string]) => [old?.[0] ?? '', e.target.value])
        }
        leftIcon={<Calendar className="h-4 w-4" />}
        placeholder="To"
        className="mb-0 flex-1"
        size="sm"
        data-testid={`date-filter-end-${column.id}`}
        aria-label={`End date for ${column.id} filter`}
      />
    </div>
  );
}