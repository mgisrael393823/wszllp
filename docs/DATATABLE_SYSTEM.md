# DataTable System Documentation

## Overview

The DataTable system is a comprehensive table solution built on top of TanStack Table (formerly React Table v8). It provides a consistent, type-safe, and feature-rich table implementation across the entire application.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Column Definitions](#column-definitions)
- [Filtering](#filtering)
- [Common Column Helpers](#common-column-helpers)
- [Migration Guide](#migration-guide)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Quick Start

### Basic Usage

```tsx
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterVariant: 'select',
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  },
];

function UserList() {
  const users = useUsers(); // Your data fetching logic
  
  return (
    <DataTable
      data={users}
      columns={columns}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

## Core Components

### DataTable

The main table component that handles all table logic including sorting, filtering, pagination, and row selection.

```tsx
interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
}
```

### Features

- **Sorting**: Click column headers to sort (ascending → descending → none)
- **Filtering**: Column-specific filters with text, select, and date range options
- **Pagination**: Built-in pagination with customizable page sizes
- **Row Selection**: Optional checkbox selection for rows
- **Loading States**: Built-in loading and error states
- **Empty States**: Customizable empty state messages

## Column Definitions

### Basic Column

```tsx
const column: ColumnDef<DataType> = {
  accessorKey: 'propertyName',
  header: 'Display Name',
};
```

### Custom Cell Rendering

```tsx
const column: ColumnDef<DataType> = {
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => (
    <Badge variant={row.original.status === 'active' ? 'success' : 'default'}>
      {row.original.status}
    </Badge>
  ),
};
```

### Column with Filtering

```tsx
const column: ColumnDef<DataType> = {
  accessorKey: 'name',
  header: 'Name',
  meta: {
    filterVariant: 'text', // 'text' | 'select' | 'date-range'
    filterOptions: [], // For select filters
  },
};
```

## Filtering

### Text Filter

Provides a debounced text input for string-based filtering.

```tsx
{
  accessorKey: 'name',
  header: 'Name',
  meta: {
    filterVariant: 'text',
  },
}
```

### Select Filter

Dropdown filter for predefined options.

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  meta: {
    filterVariant: 'select',
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ],
  },
}
```

### Date Range Filter

Two date inputs for filtering date ranges.

```tsx
{
  accessorKey: 'createdAt',
  header: 'Created Date',
  meta: {
    filterVariant: 'date-range',
  },
}
```

## Common Column Helpers

Import reusable column definitions from `common-columns.tsx`:

```tsx
import { 
  commonColumns,
  statusConfigs 
} from '@/components/ui/table-columns/common-columns';
```

### Status Column

```tsx
// Basic status column
const statusColumn = commonColumns.status<DataType>('status');

// Enhanced status with domain-specific configurations  
const enhancedStatusColumn = commonColumns.enhancedStatus<DataType>('status', 'document', 'Document Status');
```

#### Available Status Domains
- `case`: Active, Intake Scheduled, SPS Not Served, Closed
- `document`: Pending, Served, Failed
- `hearing`: Pending, Completed, Continued, Dismissed  
- `invoice`: Paid, Unpaid, Overdue
- `service`: Success, Failed, Pending

### Date Column

```tsx
// Basic date column
const dateColumn = commonColumns.date<DataType>('createdAt', 'Created');

// Date with time display
const dateTimeColumn = commonColumns.dateTime<DataType>('updatedAt', 'Last Updated', true);
```

### Currency Column

```tsx
// Basic currency column
const amountColumn = commonColumns.currency<DataType>('amount', 'Amount');

// Enhanced currency with icon
const enhancedAmountColumn = commonColumns.enhancedCurrency<DataType>('amount', 'Total', true);
```

### Boolean Column

```tsx
const completeColumn = commonColumns.boolean<DataType>('isComplete', 'Complete', 'Yes', 'No');
```

### Case Title Column

```tsx
// For the common "Plaintiff v. Defendant" pattern
const caseTitleColumn = commonColumns.caseTitle<DataType>('plaintiff', 'defendant', 'Case');
```

### Contact Display Column

```tsx
// Contact with avatar and role
const contactColumn = commonColumns.contactDisplay<DataType>(
  'name', 
  'Contact', 
  'role',     // optional role field
  'avatar',   // optional avatar field
  true        // show avatar
);
```

### File Link Column

```tsx
// File with download link and type
const fileColumn = commonColumns.fileLink<DataType>(
  'fileURL', 
  'filename', 
  'Document',
  'fileType'  // optional file type field
);
```

## Migration Guide

### From Old Table Component

Before:
```tsx
import Table from '@/components/ui/Table';

<Table
  data={data}
  columns={[
    { accessor: 'name', header: 'Name' },
    { accessor: 'email', header: 'Email' },
  ]}
  keyField="id"
/>
```

After:
```tsx
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<DataType>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

<DataTable data={data} columns={columns} />
```

### Key Changes

1. **Column Definition**: Use `accessorKey` instead of `accessor`
2. **Type Safety**: Columns are now typed with `ColumnDef<T>`
3. **Cell Rendering**: Use `cell` function instead of `render`
4. **Filtering**: Add `meta.filterVariant` to enable column filters
5. **No keyField**: TanStack Table handles row keys automatically

## API Reference

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of data to display |
| `columns` | `ColumnDef<T>[]` | Required | Column definitions |
| `isLoading` | `boolean` | `false` | Show loading state |
| `error` | `Error \| null` | `null` | Show error state |
| `className` | `string` | `''` | Additional CSS classes |
| `enableRowSelection` | `boolean` | `false` | Enable row checkboxes |
| `onRowSelectionChange` | `(selection) => void` | - | Row selection callback |
| `initialSorting` | `SortingState` | `[]` | Initial sort state |
| `initialFilters` | `ColumnFiltersState` | `[]` | Initial filter state |

### Column Meta Options

```tsx
interface ColumnMeta {
  filterVariant?: 'text' | 'select' | 'date-range';
  filterOptions?: Array<{
    label: string;
    value: string | number | boolean;
  }>;
}
```

## Examples

### Complete Example with All Features

```tsx
import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { createStatusColumn, createDateColumn, createCurrencyColumn } from '@/components/ui/table-columns/common-columns';

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  createdAt: string;
}

function InvoiceList() {
  const [selectedRows, setSelectedRows] = useState({});
  const { data: invoices, isLoading, error } = useInvoices();

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'client',
      header: 'Client',
      meta: {
        filterVariant: 'text',
      },
    },
    createCurrencyColumn<Invoice>({
      accessorKey: 'amount',
      header: 'Amount',
    }),
    createStatusColumn<Invoice>({
      accessorKey: 'status',
      header: 'Status',
      statuses: {
        paid: { label: 'Paid', variant: 'success' },
        pending: { label: 'Pending', variant: 'warning' },
        overdue: { label: 'Overdue', variant: 'destructive' },
      },
    }),
    createDateColumn<Invoice>({
      accessorKey: 'dueDate',
      header: 'Due Date',
      enableFilter: true,
    }),
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewInvoice(row.original.id)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      data={invoices}
      columns={columns}
      isLoading={isLoading}
      error={error}
      enableRowSelection
      onRowSelectionChange={setSelectedRows}
      initialSorting={[{ id: 'dueDate', desc: false }]}
    />
  );
}
```

### Custom Filter Implementation

```tsx
// Custom filter for a complex data type
const customFilterColumn: ColumnDef<DataType> = {
  accessorKey: 'tags',
  header: 'Tags',
  filterFn: (row, columnId, filterValue) => {
    const tags = row.getValue(columnId) as string[];
    return tags.some(tag => 
      tag.toLowerCase().includes(filterValue.toLowerCase())
    );
  },
  meta: {
    filterVariant: 'text',
  },
};
```

## Best Practices

### 1. Type Your Columns

Always use proper TypeScript types for your column definitions:

```tsx
const columns: ColumnDef<YourDataType>[] = [
  // columns...
];
```

### 2. Use Column Helpers

Leverage the common column helpers for consistency:

```tsx
import { createDateColumn, createStatusColumn } from '@/components/ui/table-columns/common-columns';

const columns = [
  createDateColumn<DataType>({ accessorKey: 'date', header: 'Date' }),
  createStatusColumn<DataType>({ /* ... */ }),
];
```

### 3. Memoize Column Definitions

For performance, memoize column definitions that include callbacks:

```tsx
const columns = useMemo<ColumnDef<DataType>[]>(() => [
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button onClick={() => handleAction(row.original)}>
        Action
      </Button>
    ),
  },
], [handleAction]);
```

### 4. Handle Loading and Error States

Always provide loading and error props for better UX:

```tsx
<DataTable
  data={data ?? []}
  columns={columns}
  isLoading={isLoading}
  error={error}
/>
```

### 5. Use Initial States for Better UX

Set initial sorting or filtering for common use cases:

```tsx
<DataTable
  data={data}
  columns={columns}
  initialSorting={[{ id: 'createdAt', desc: true }]}
  initialFilters={[{ id: 'status', value: 'active' }]}
/>
```

## Troubleshooting

### Common Issues

1. **Type errors with columns**: Ensure your column definitions match your data type
2. **Filter not working**: Check that `meta.filterVariant` is set on the column
3. **Sorting not working**: Some data types may need custom sorting functions
4. **Performance issues**: Memoize columns and consider pagination for large datasets

### Debug Mode

Enable TanStack Table's debug mode in development:

```tsx
import { useReactTable } from '@tanstack/react-table';

// In your table component
const table = useReactTable({
  // ... options
  debugTable: true,
  debugHeaders: true,
  debugColumns: true,
});
```