# Table Migration Guide

This guide helps you migrate from the old custom Table component to the new DataTable system based on TanStack Table.

## Quick Migration Checklist

- [ ] Update imports from `Table` to `DataTable`
- [ ] Convert column definitions to TanStack format
- [ ] Add TypeScript types for columns
- [ ] Update cell renderers
- [ ] Add filtering metadata where needed
- [ ] Remove `keyField` prop
- [ ] Test sorting and filtering functionality

## Step-by-Step Migration

### 1. Update Imports

```diff
- import Table from '@/components/ui/Table';
+ import { DataTable } from '@/components/ui/DataTable';
+ import { ColumnDef } from '@tanstack/react-table';
```

### 2. Convert Column Definitions

#### Basic Columns

Old format:
```tsx
const columns = [
  { accessor: 'name', header: 'Name' },
  { accessor: 'email', header: 'Email' },
];
```

New format:
```tsx
const columns: ColumnDef<DataType>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];
```

#### Columns with Custom Rendering

Old format:
```tsx
{
  accessor: 'status',
  header: 'Status',
  render: (value) => (
    <span className={`badge-${value}`}>{value}</span>
  ),
}
```

New format:
```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => (
    <span className={`badge-${row.original.status}`}>
      {row.original.status}
    </span>
  ),
}
```

#### Columns with Actions

Old format:
```tsx
{
  accessor: 'actions',
  header: 'Actions',
  render: (_, row) => (
    <Button onClick={() => handleEdit(row.id)}>
      Edit
    </Button>
  ),
}
```

New format:
```tsx
{
  id: 'actions', // Use 'id' for non-data columns
  header: 'Actions',
  cell: ({ row }) => (
    <Button onClick={() => handleEdit(row.original.id)}>
      Edit
    </Button>
  ),
}
```

### 3. Add Filtering

The new system supports column-specific filters:

```tsx
const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      filterVariant: 'text', // Adds text filter
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterVariant: 'select', // Adds dropdown filter
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    meta: {
      filterVariant: 'date-range', // Adds date range filter
    },
  },
];
```

### 4. Update Table Usage

Old usage:
```tsx
<Table
  data={data}
  columns={columns}
  keyField="id"
  emptyMessage="No data found"
  onRowClick={handleRowClick}
/>
```

New usage:
```tsx
<DataTable
  data={data}
  columns={columns}
  // keyField is no longer needed
  // emptyMessage is built-in
  // For row clicks, add to cell or use row selection
/>
```

### 5. Common Patterns

#### Date Formatting

Old:
```tsx
{
  accessor: 'date',
  header: 'Date',
  render: (value) => format(new Date(value), 'MMM d, yyyy'),
}
```

New (using helper):
```tsx
import { createDateColumn } from '@/components/ui/table-columns/common-columns';

createDateColumn<DataType>({
  accessorKey: 'date',
  header: 'Date',
  dateFormat: 'MMM d, yyyy',
})
```

#### Status Badges

Old:
```tsx
{
  accessor: 'status',
  header: 'Status',
  render: (value) => (
    <span className={`status-${value}`}>{value}</span>
  ),
}
```

New (using helper):
```tsx
import { createStatusColumn } from '@/components/ui/table-columns/common-columns';

createStatusColumn<DataType>({
  accessorKey: 'status',
  header: 'Status',
  statuses: {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'default' },
  },
})
```

#### Currency Display

Old:
```tsx
{
  accessor: 'amount',
  header: 'Amount',
  render: (value) => `$${value.toFixed(2)}`,
}
```

New (using helper):
```tsx
import { createCurrencyColumn } from '@/components/ui/table-columns/common-columns';

createCurrencyColumn<DataType>({
  accessorKey: 'amount',
  header: 'Amount',
})
```

## Real Migration Examples

### Example 1: Simple List Table

Before:
```tsx
const CaseList = () => {
  const { cases } = useCases();
  
  const columns = [
    { accessor: 'caseNumber', header: 'Case #' },
    { accessor: 'plaintiff', header: 'Plaintiff' },
    { accessor: 'defendant', header: 'Defendant' },
    { 
      accessor: 'status', 
      header: 'Status',
      render: (status) => (
        <Badge variant={status === 'active' ? 'success' : 'default'}>
          {status}
        </Badge>
      ),
    },
  ];
  
  return (
    <Table
      data={cases}
      columns={columns}
      keyField="id"
    />
  );
};
```

After:
```tsx
const CaseList = () => {
  const { cases } = useCases();
  
  const columns: ColumnDef<Case>[] = [
    {
      accessorKey: 'caseNumber',
      header: 'Case #',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'plaintiff',
      header: 'Plaintiff',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'defendant',
      header: 'Defendant',
      meta: { filterVariant: 'text' },
    },
    createStatusColumn<Case>({
      accessorKey: 'status',
      header: 'Status',
      statuses: {
        active: { label: 'Active', variant: 'success' },
        closed: { label: 'Closed', variant: 'default' },
      },
    }),
  ];
  
  return <DataTable data={cases} columns={columns} />;
};
```

### Example 2: Complex Table with Actions

Before:
```tsx
const DocumentList = () => {
  const { documents } = useDocuments();
  
  const columns = [
    { accessor: 'name', header: 'Document' },
    { accessor: 'type', header: 'Type' },
    { 
      accessor: 'uploadedAt', 
      header: 'Uploaded',
      render: (date) => format(new Date(date), 'MMM d, yyyy'),
    },
    {
      accessor: 'actions',
      header: '',
      render: (_, doc) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleView(doc.id)}>
            View
          </Button>
          <Button size="sm" onClick={() => handleDownload(doc.id)}>
            Download
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <Table
      data={documents}
      columns={columns}
      keyField="id"
      onRowClick={handleRowClick}
    />
  );
};
```

After:
```tsx
const DocumentList = () => {
  const { documents, isLoading, error } = useDocuments();
  
  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: 'name',
      header: 'Document',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      meta: {
        filterVariant: 'select',
        filterOptions: [
          { label: 'Contract', value: 'contract' },
          { label: 'Invoice', value: 'invoice' },
          { label: 'Report', value: 'report' },
        ],
      },
    },
    createDateColumn<Document>({
      accessorKey: 'uploadedAt',
      header: 'Uploaded',
      enableFilter: true,
    }),
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleView(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleDownload(row.original.id)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <DataTable
      data={documents}
      columns={columns}
      isLoading={isLoading}
      error={error}
    />
  );
};
```

## Feature Comparison

| Feature | Old Table | New DataTable |
|---------|-----------|---------------|
| Sorting | Basic | Advanced with multi-column |
| Filtering | External | Built-in column filters |
| Pagination | External | Built-in with size options |
| Row Selection | Manual | Built-in with callbacks |
| TypeScript | Partial | Full type safety |
| Performance | Good | Optimized with virtualization ready |
| Accessibility | Basic | Enhanced ARIA support |

## Troubleshooting

### Common Migration Issues

1. **"Cannot read property 'x' of undefined"**
   - Old: `render: (value, row) => row.name`
   - New: `cell: ({ row }) => row.original.name`

2. **Filters not showing**
   - Add `meta: { filterVariant: 'text' }` to column definition

3. **Actions column not working**
   - Use `id: 'actions'` instead of `accessorKey` for non-data columns

4. **Date sorting issues**
   - Ensure dates are proper Date objects or ISO strings
   - Use `sortingFn: 'datetime'` if needed

5. **Performance degradation**
   - Memoize column definitions with `useMemo`
   - Enable pagination for large datasets

## Getting Help

- Check the [DataTable System Documentation](./DATATABLE_SYSTEM.md)
- Review working examples in the codebase
- Look for similar patterns in migrated components

## Next Steps

After migration:
1. Add appropriate filters to improve UX
2. Consider using common column helpers for consistency
3. Add loading and error states
4. Test sorting and filtering functionality
5. Verify accessibility with keyboard navigation