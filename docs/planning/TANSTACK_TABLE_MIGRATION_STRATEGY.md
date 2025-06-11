# TanStack Table Migration Strategy for WSZLLP

## Overview
This document provides a detailed, step-by-step plan to migrate the existing table implementations in WSZLLP to use TanStack Table, providing advanced features like multi-column sorting, faceted filtering, and better performance.

## Prerequisites

### 1. Install Required Dependencies
```bash
npm install @tanstack/react-table
```

### 2. Verify Existing Dependencies
Ensure these are already installed (they should be based on package.json):
- `clsx` (for className utilities)
- `lucide-react` (for icons)
- `date-fns` (for date formatting)

## Phase 1: Foundation Setup

### Step 1.1: Create TanStack Table Type Definitions

Create file: `src/types/table.types.ts`

```typescript
import { ColumnDef, FilterFn, Row } from '@tanstack/react-table';

// Extend TanStack Table's column meta to support filter variants
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select' | 'date' | 'multiselect';
    align?: 'left' | 'center' | 'right';
  }
}

// Common filter types
export type FilterConfig = {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'range';
  options?: Array<{ value: string; label: string }>;
};

// Data table props
export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading?: boolean;
  error?: Error | null;
  onRowClick?: (row: TData) => void;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  className?: string;
}
```

### Step 1.2: Create Filter Components

Create file: `src/components/ui/table-filters/TextFilter.tsx`

```typescript
import React from 'react';
import { Column } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { Input } from '../Input';

interface TextFilterProps<TData> {
  column: Column<TData, unknown>;
  placeholder?: string;
}

export function TextFilter<TData>({ column, placeholder }: TextFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        type="text"
        value={(columnFilterValue ?? '') as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={placeholder ?? `Search ${column.id}...`}
        className="pl-9 pr-9"
      />
      {columnFilterValue && (
        <button
          onClick={() => column.setFilterValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
        </button>
      )}
    </div>
  );
}
```

Create file: `src/components/ui/table-filters/SelectFilter.tsx`

```typescript
import React from 'react';
import { Column } from '@tanstack/react-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';

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
      onValueChange={(value) => column.setFilterValue(value || undefined)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? 'All'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

Create file: `src/components/ui/table-filters/DateRangeFilter.tsx`

```typescript
import React from 'react';
import { Column } from '@tanstack/react-table';
import { Calendar } from 'lucide-react';
import { Input } from '../Input';
import { format } from 'date-fns';

interface DateRangeFilterProps<TData> {
  column: Column<TData, unknown>;
}

export function DateRangeFilter<TData>({ column }: DateRangeFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue() as [string, string] | undefined;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          type="date"
          value={columnFilterValue?.[0] ?? ''}
          onChange={(e) =>
            column.setFilterValue((old: [string, string]) => [e.target.value, old?.[1] ?? ''])
          }
          className="pl-9"
          placeholder="From"
        />
      </div>
      <div className="relative flex-1">
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          type="date"
          value={columnFilterValue?.[1] ?? ''}
          onChange={(e) =>
            column.setFilterValue((old: [string, string]) => [old?.[0] ?? '', e.target.value])
          }
          className="pl-9"
          placeholder="To"
        />
      </div>
    </div>
  );
}
```

### Step 1.3: Create Core DataTable Component

Create file: `src/components/ui/DataTable.tsx`

```typescript
import React, { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Columns3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { LoadingState } from './StateComponents';
import { ErrorState } from './ErrorState';
import { DataTableProps } from '../../types/table.types';
import { TextFilter } from './table-filters/TextFilter';
import { SelectFilter } from './table-filters/SelectFilter';
import { DateRangeFilter } from './table-filters/DateRangeFilter';
import Pagination from './Pagination';
import { cn } from '../../lib/utils';

export function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  error = null,
  onRowClick,
  enableRowSelection = false,
  enablePagination = true,
  pageSize = 10,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Add selection column if enabled
  const tableColumns = React.useMemo(() => {
    if (enableRowSelection) {
      return [
        {
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        ...columns,
      ] as ColumnDef<TData>[];
    }
    return columns;
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Render filters based on column meta
  const renderColumnFilter = (column: any) => {
    const filterVariant = column.columnDef.meta?.filterVariant;

    switch (filterVariant) {
      case 'select':
        const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()).sort();
        const options = uniqueValues.map((value) => ({
          value: String(value),
          label: String(value),
        }));
        return <SelectFilter column={column} options={options} />;
      case 'date':
        return <DateRangeFilter column={column} />;
      case 'text':
      default:
        return <TextFilter column={column} />;
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }

  if (error) {
    return <ErrorState title="Error loading data" message={error.message} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters and column visibility */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {table
            .getAllColumns()
            .filter(
              (column) =>
                column.getCanFilter() && column.columnDef.meta?.filterVariant
            )
            .map((column) => (
              <div key={column.id} className="w-48">
                {renderColumnFilter(column)}
              </div>
            ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        meta?.align === 'center' && 'text-center',
                        meta?.align === 'right' && 'text-right'
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center space-x-2',
                            header.column.getCanSort() &&
                              'cursor-pointer select-none hover:text-neutral-900'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-neutral-400">
                              {header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          meta?.align === 'center' && 'text-center',
                          meta?.align === 'right' && 'text-right'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </div>
      )}
    </div>
  );
}
```

### Step 1.4: Create Common Column Definitions

Create file: `src/components/ui/table-columns/common-columns.tsx`

```typescript
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { getStatusColor } from '../../../utils/statusColors';
import { formatCurrency } from '../../../utils/utils';

export const commonColumns = {
  status: <T extends Record<string, any>>(field: keyof T): ColumnDef<T> => ({
    accessorKey: field as string,
    header: 'Status',
    cell: ({ row }) => {
      const value = row.getValue(field as string) as string;
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            value
          )}`}
        >
          {value}
        </span>
      );
    },
    meta: {
      filterVariant: 'select',
    },
  }),

  date: <T extends Record<string, any>>(
    field: keyof T,
    header: string = 'Date'
  ): ColumnDef<T> => ({
    accessorKey: field as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(field as string);
      if (!value) return <span className="text-neutral-400">Not set</span>;

      try {
        const date = new Date(value);
        return (
          <div className="flex items-center gap-1 text-neutral-600">
            <Calendar className="w-3 h-3" />
            <span>{format(date, 'MMM dd, yyyy')}</span>
          </div>
        );
      } catch {
        return <span className="text-neutral-400">Invalid date</span>;
      }
    },
    meta: {
      filterVariant: 'date',
    },
  }),

  currency: <T extends Record<string, any>>(
    field: keyof T,
    header: string = 'Amount'
  ): ColumnDef<T> => ({
    accessorKey: field as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(field as string) as number;
      return formatCurrency(value);
    },
    meta: {
      filterVariant: 'range',
      align: 'right',
    },
  }),

  boolean: <T extends Record<string, any>>(
    field: keyof T,
    header: string,
    trueLabel: string = 'Yes',
    falseLabel: string = 'No'
  ): ColumnDef<T> => ({
    accessorKey: field as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(field as string) as boolean;
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'
          }`}
        >
          {value ? trueLabel : falseLabel}
        </span>
      );
    },
    meta: {
      filterVariant: 'select',
    },
  }),
};
```

## Phase 2: Pilot Implementation - CaseList Component

### Step 2.1: Create New CaseList with TanStack Table

Create file: `src/components/cases/CaseListV2.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../../lib/supabaseClient';
import { DataTable } from '../ui/DataTable';
import { commonColumns } from '../ui/table-columns/common-columns';
import { Card } from '../ui';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface Case {
  caseId: string;
  plaintiff: string;
  defendant: string;
  address: string;
  status: string;
  dateFiled: string | null;
  createdAt: string;
  updatedAt: string;
}

const CaseListV2: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('cases').select('*');

      if (error) throw error;

      const mappedCases: Case[] = data.map((c) => ({
        caseId: c.id,
        plaintiff: c.plaintiff,
        defendant: c.defendant,
        address: c.address || '',
        status: c.status,
        dateFiled: c.dateFiled || null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));

      setCases(mappedCases);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Case>[] = [
    {
      accessorKey: 'plaintiff',
      header: 'Plaintiff',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'defendant',
      header: 'Defendant',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'address',
      header: 'Address',
      meta: {
        filterVariant: 'text',
      },
    },
    commonColumns.status<Case>('status'),
    commonColumns.date<Case>('dateFiled', 'Date Filed'),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Manage and track all your legal cases</p>
        </div>
        <Button onClick={() => navigate('/cases/new')} icon={<Plus size={16} />}>
          New Case
        </Button>
      </div>

      <Card>
        <DataTable
          data={cases}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRowClick={(row) => navigate(`/cases/${row.caseId}`)}
          enableRowSelection
        />
      </Card>
    </div>
  );
};

export default CaseListV2;
```

### Step 2.2: Update App.tsx to Use New Component

In `src/App.tsx`, temporarily add a route to test the new component:

```typescript
// Add this route alongside existing routes
<Route path="/cases-v2" element={<CaseListV2 />} />
```

### Step 2.3: Test and Compare

1. Navigate to `/cases-v2` to test the new implementation
2. Compare functionality with the original `/cases` route
3. Verify all features work:
   - Sorting by columns
   - Filtering by text, status, and date
   - Pagination
   - Row selection
   - Click to navigate to case details

## Phase 3: Full Migration

### Step 3.1: Create Migration Order

Based on complexity and dependencies, migrate components in this order:

1. **CaseList** ✓ (completed in Phase 2)
2. **ContactList** - Uses Refine hooks, needs careful migration
3. **HearingList** - Straightforward migration
4. **DocumentList** - Has custom hooks, moderate complexity
5. **InvoiceList** - Similar to HearingList
6. **ServiceLogsList** - Most complex due to relationships

### Step 3.2: Migrate ContactList

Create file: `src/components/contacts/ContactListV2.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DataTable } from '../ui/DataTable';
import { Card } from '../ui/shadcn-card';
import { Button } from '../ui/Button';
import { Contact } from '../../types/schema';

const ContactListV2: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
        await fetchContacts();
      } catch (err) {
        console.error('Error deleting contact:', err);
      }
    }
  };

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            {row.original.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="font-medium text-neutral-900">{row.original.name}</div>
            <div className="text-sm text-neutral-500">{row.original.role || 'Contact'}</div>
          </div>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Mail size={16} className="text-neutral-400 mr-2" />
          <span>{row.original.email || '—'}</span>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Phone size={16} className="text-neutral-400 mr-2" />
          <span>{row.original.phone || '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      meta: {
        filterVariant: 'select',
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate(`/contacts/${row.original.id}`)}
            icon={<Eye size={16} />}
            aria-label="View contact"
          />
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate(`/contacts/${row.original.id}/edit`)}
            icon={<Edit size={16} />}
            aria-label="Edit contact"
          />
          <Button
            variant="text"
            size="sm"
            onClick={(e) => handleDelete(row.original.id, e)}
            icon={<Trash2 size={16} />}
            aria-label="Delete contact"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <Card>
      <DataTable
        data={contacts}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRowClick={(row) => navigate(`/contacts/${row.id}`)}
      />
    </Card>
  );
};

export default ContactListV2;
```

### Step 3.3: Continue Migration Pattern

For each remaining component:

1. Create a V2 version using DataTable
2. Test thoroughly alongside the original
3. Once verified, replace the original import in the parent component
4. Delete the old component file

## Phase 4: Cleanup and Optimization

### Step 4.1: Remove Old Table Component

Once all components are migrated:

1. Delete `src/components/ui/Table.tsx` (the old custom implementation)
2. Update any remaining imports to use the shadcn Table components directly

### Step 4.2: Add Advanced Features

Create file: `src/hooks/useTableState.ts`

```typescript
import { useState, useCallback } from 'react';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

export function useTableState(storageKey: string) {
  // Load saved state from localStorage
  const loadState = <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`${storageKey}_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [sorting, setSorting] = useState<SortingState>(() =>
    loadState('sorting', [])
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    loadState('filters', [])
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    loadState('visibility', {})
  );

  // Save state to localStorage
  const saveState = useCallback(
    (key: string, value: any) => {
      localStorage.setItem(`${storageKey}_${key}`, JSON.stringify(value));
    },
    [storageKey]
  );

  // Enhanced setters that also save to localStorage
  const setSortingWithSave = useCallback(
    (updater: any) => {
      setSorting((old) => {
        const newState = typeof updater === 'function' ? updater(old) : updater;
        saveState('sorting', newState);
        return newState;
      });
    },
    [saveState]
  );

  const setColumnFiltersWithSave = useCallback(
    (updater: any) => {
      setColumnFilters((old) => {
        const newState = typeof updater === 'function' ? updater(old) : updater;
        saveState('filters', newState);
        return newState;
      });
    },
    [saveState]
  );

  const setColumnVisibilityWithSave = useCallback(
    (updater: any) => {
      setColumnVisibility((old) => {
        const newState = typeof updater === 'function' ? updater(old) : updater;
        saveState('visibility', newState);
        return newState;
      });
    },
    [saveState]
  );

  return {
    sorting,
    setSorting: setSortingWithSave,
    columnFilters,
    setColumnFilters: setColumnFiltersWithSave,
    columnVisibility,
    setColumnVisibility: setColumnVisibilityWithSave,
  };
}
```

### Step 4.3: Add Export Functionality

Create file: `src/components/ui/table-actions/ExportButton.tsx`

```typescript
import React from 'react';
import { Table } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../DropdownMenu';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportButtonProps<TData> {
  table: Table<TData>;
  filename?: string;
}

export function ExportButton<TData>({ table, filename = 'export' }: ExportButtonProps<TData>) {
  const exportCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions')
      .map((col) => col.id);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row.getValue(header);
            // Handle different value types
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions')
      .map((col) => col.id);

    const data = rows.map((row) =>
      headers.reduce((acc, header) => {
        acc[header] = row.getValue(header);
        return acc;
      }, {} as Record<string, any>)
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportCSV}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>Export as Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Phase 5: Testing and Validation

### Step 5.1: Create Test Checklist

For each migrated component, verify:

- [ ] All data loads correctly
- [ ] Sorting works for all sortable columns
- [ ] Filters work correctly for each filter type
- [ ] Pagination maintains state when filtering
- [ ] Row selection works (if enabled)
- [ ] Row click navigation works
- [ ] Column visibility toggle works
- [ ] Export functionality works
- [ ] Responsive design maintained
- [ ] Performance is acceptable with large datasets
- [ ] Accessibility features work (keyboard navigation)

### Step 5.2: Performance Testing

Create a test with large dataset:

```typescript
// In development only - test with 10,000 rows
const generateTestData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    caseId: `CASE-${i}`,
    plaintiff: `Plaintiff ${i}`,
    defendant: `Defendant ${i}`,
    address: `${i} Main Street`,
    status: ['Active', 'Pending', 'Closed'][i % 3],
    dateFiled: new Date(2024, 0, 1 + (i % 365)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};
```

## Phase 6: Documentation and Training

### Step 6.1: Update Component Documentation

Create file: `src/components/ui/DataTable.md`

```markdown
# DataTable Component

The DataTable component is a powerful, feature-rich table implementation using TanStack Table.

## Features

- Sorting (single and multi-column)
- Filtering (text, select, date range, custom)
- Pagination
- Row selection
- Column visibility
- Export to CSV/Excel
- Responsive design
- Keyboard navigation

## Basic Usage

\```typescript
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      filterVariant: 'text',
    },
  },
  // ... more columns
];

<DataTable
  data={data}
  columns={columns}
  isLoading={isLoading}
  error={error}
  onRowClick={(row) => console.log(row)}
/>
\```

## Column Configuration

### Filter Variants

- `text` - Text input with search icon
- `select` - Dropdown with unique values
- `date` - Date range picker
- `range` - Numeric range inputs
- `multiselect` - Multiple selection dropdown

### Column Meta Options

- `filterVariant` - Type of filter to display
- `align` - Text alignment ('left' | 'center' | 'right')

## Advanced Features

### Persistent State

Use the `useTableState` hook to persist table state:

\```typescript
const tableState = useTableState('cases-table');

<DataTable
  {...tableState}
  // other props
/>
\```

### Custom Cell Rendering

\```typescript
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => (
    <StatusBadge status={row.getValue('status')} />
  ),
}
\```
```

### Step 6.2: Migration Notes

Create file: `docs/planning/TANSTACK_TABLE_MIGRATION_NOTES.md`

Document any issues encountered and solutions applied during migration.

## Completion Checklist

- [ ] Phase 1: Foundation setup complete
- [ ] Phase 2: CaseList pilot successful
- [ ] Phase 3: All components migrated
- [ ] Phase 4: Cleanup and optimization done
- [ ] Phase 5: Testing completed
- [ ] Phase 6: Documentation updated

## Rollback Plan

If issues arise:

1. Keep V2 components alongside originals during testing
2. Use feature flags to toggle between implementations
3. Maintain the old Table component until all migrations are verified
4. Have database backups before testing with production data

## Success Metrics

- Improved performance (measure load time with 1000+ rows)
- Reduced code duplication (measure LOC reduction)
- Enhanced user experience (gather user feedback)
- Easier maintenance (track time to implement new features)
