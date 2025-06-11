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

## Edge Case Migration Examples

### Complex Custom Cell Renderers

#### Multi-Component Cell with Actions

**Before:**
```tsx
{
  accessor: 'document',
  header: 'Document',
  render: (value, row) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <FileIcon type={row.fileType} />
        </div>
        <div>
          <p className="text-sm font-medium">{row.filename}</p>
          <p className="text-xs text-gray-500">{row.fileSize}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button size="xs" onClick={() => handleDownload(row.id)}>
          <Download className="h-3 w-3" />
        </Button>
        <Button size="xs" onClick={() => handlePreview(row.id)}>
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </div>
  ),
}
```

**After:**
```tsx
{
  id: 'document',
  header: 'Document',
  cell: ({ row }) => {
    const { filename, fileType, fileSize, id } = row.original;
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <FileIcon type={fileType} />
          </div>
          <div>
            <p className="text-sm font-medium">{filename}</p>
            <p className="text-xs text-gray-500">{fileSize}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button size="xs" onClick={() => handleDownload(id)}>
            <Download className="h-3 w-3" />
          </Button>
          <Button size="xs" onClick={() => handlePreview(id)}>
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  },
}
```

#### Conditional Rendering with Complex Logic

**Before:**
```tsx
{
  accessor: 'status',
  header: 'Status',
  render: (status, row) => {
    if (row.isArchived) {
      return <Badge variant="secondary">Archived</Badge>;
    }
    
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Draft</Badge>
            {row.autoSave && <Clock className="h-3 w-3 text-gray-400" />}
          </div>
        );
      case 'published':
        return <Badge variant="success">Published</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  },
}
```

**After:**
```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => {
    const { status, isArchived, expiresAt, autoSave } = row.original;
    
    if (isArchived) {
      return <Badge variant="secondary">Archived</Badge>;
    }
    
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Draft</Badge>
            {autoSave && <Clock className="h-3 w-3 text-gray-400" />}
          </div>
        );
      case 'published':
        return <Badge variant="success">Published</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  },
}
```

### Tables with Custom Sorting and Filtering

#### Complex Data Types

**Before:**
```tsx
const columns = [
  {
    accessor: 'tags',
    header: 'Tags',
    render: (tags) => (
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
        ))}
      </div>
    ),
    // Custom filter was handled externally
  },
];
```

**After:**
```tsx
const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.map(tag => (
          <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
        ))}
      </div>
    ),
    // Custom filter function for array data
    filterFn: (row, columnId, filterValue) => {
      const tags = row.getValue(columnId) as string[];
      return tags.some(tag => 
        tag.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
    meta: {
      filterVariant: 'text',
    },
  },
];
```

#### Nested Object Access

**Before:**
```tsx
{
  accessor: 'user.profile.name',
  header: 'User Name',
  render: (value, row) => (
    <div className="flex items-center space-x-2">
      <Avatar src={row.user?.profile?.avatar} size="sm" />
      <span>{value || 'Unknown User'}</span>
    </div>
  ),
}
```

**After:**
```tsx
{
  accessorFn: (row) => row.user?.profile?.name,
  id: 'userName',
  header: 'User Name',
  cell: ({ row }) => {
    const name = row.user?.profile?.name;
    const avatar = row.user?.profile?.avatar;
    return (
      <div className="flex items-center space-x-2">
        <Avatar src={avatar} size="sm" />
        <span>{name || 'Unknown User'}</span>
      </div>
    );
  },
  // Enable sorting for nested data
  sortingFn: (rowA, rowB) => {
    const nameA = rowA.original.user?.profile?.name || '';
    const nameB = rowB.original.user?.profile?.name || '';
    return nameA.localeCompare(nameB);
  },
}
```

### Tables with External State Management

#### Tables Connected to Redux/Zustand

**Before:**
```tsx
const CaseList = () => {
  const { cases, filters, sorting, pagination } = useSelector(selectCases);
  const dispatch = useDispatch();
  
  const handleSort = (column, direction) => {
    dispatch(updateSorting({ column, direction }));
  };
  
  const handleFilter = (column, value) => {
    dispatch(updateFilter({ column, value }));
  };
  
  return (
    <Table
      data={cases}
      columns={columns}
      onSort={handleSort}
      onFilter={handleFilter}
      sortBy={sorting.column}
      sortDirection={sorting.direction}
    />
  );
};
```

**After:**
```tsx
const CaseList = () => {
  const { cases, filters, sorting } = useSelector(selectCases);
  const dispatch = useDispatch();
  
  // Convert external state to TanStack Table format
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    Object.entries(filters).map(([id, value]) => ({ id, value }))
  );
  
  const [sortingState, setSortingState] = useState<SortingState>(
    sorting.column ? [{ id: sorting.column, desc: sorting.direction === 'desc' }] : []
  );
  
  // Sync with external state
  useEffect(() => {
    const newFilters = columnFilters.reduce((acc, filter) => {
      acc[filter.id] = filter.value;
      return acc;
    }, {} as Record<string, any>);
    dispatch(updateFilters(newFilters));
  }, [columnFilters, dispatch]);
  
  useEffect(() => {
    const newSorting = sortingState[0] || null;
    dispatch(updateSorting({
      column: newSorting?.id || null,
      direction: newSorting?.desc ? 'desc' : 'asc'
    }));
  }, [sortingState, dispatch]);
  
  return (
    <DataTable
      data={cases}
      columns={columns}
      initialFilters={columnFilters}
      initialSorting={sortingState}
      onColumnFiltersChange={setColumnFilters}
      onSortingChange={setSortingState}
    />
  );
};
```

### Performance Optimization for Large Tables

#### Virtual Scrolling Migration

**Before:**
```tsx
const LargeTable = ({ data }) => {
  const [visibleData, setVisibleData] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Custom virtualization logic
  const updateVisibleData = useCallback(() => {
    const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
    const endIndex = Math.min(startIndex + VISIBLE_ROWS, data.length);
    setVisibleData(data.slice(startIndex, endIndex));
  }, [data, scrollTop]);
  
  return (
    <div onScroll={(e) => setScrollTop(e.target.scrollTop)}>
      <Table data={visibleData} columns={columns} />
    </div>
  );
};
```

**After:**
```tsx
// Install @tanstack/react-virtual for virtualization
import { useVirtualizer } from '@tanstack/react-virtual';

const LargeTable = ({ data }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 10,
  });
  
  const columns = useMemo(() => [
    // Column definitions
  ], []);
  
  return (
    <div 
      ref={parentRef}
      className="h-96 overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = data[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Render row content */}
              <TableRow data={row} columns={columns} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

## Troubleshooting Edge Cases

### 1. **Complex Data Transformations**
```tsx
// For data that needs transformation before display
const columns: ColumnDef<RawData>[] = [
  {
    accessorFn: (row) => {
      // Complex transformation logic
      return processComplexData(row.rawField);
    },
    id: 'processedData',
    header: 'Processed Data',
  },
];
```

### 2. **Multiple Action Buttons with Conditional Logic**
```tsx
{
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => {
    const { permissions, status, id } = row.original;
    
    return (
      <div className="flex space-x-1">
        {permissions.canEdit && (
          <Button size="xs" onClick={() => handleEdit(id)}>
            Edit
          </Button>
        )}
        {permissions.canDelete && status !== 'archived' && (
          <Button size="xs" variant="destructive" onClick={() => handleDelete(id)}>
            Delete
          </Button>
        )}
        {status === 'draft' && (
          <Button size="xs" onClick={() => handlePublish(id)}>
            Publish
          </Button>
        )}
      </div>
    );
  },
}
```

### 3. **Custom Sorting for Complex Data Types**
```tsx
{
  accessorKey: 'priority',
  header: 'Priority',
  sortingFn: (rowA, rowB) => {
    const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
    const aValue = priorityOrder[rowA.original.priority] || 0;
    const bValue = priorityOrder[rowB.original.priority] || 0;
    return aValue - bValue;
  },
}
```

## Getting Help

- Check the [DataTable System Documentation](./DATATABLE_SYSTEM.md)
- Review working examples in the codebase
- Look for similar patterns in migrated components
- For complex migrations, consider breaking them into smaller steps
- Test each migration thoroughly before moving to the next

## Next Steps

After migration:
1. Add appropriate filters to improve UX
2. Consider using common column helpers for consistency
3. Add loading and error states
4. Test sorting and filtering functionality
5. Verify accessibility with keyboard navigation
6. Performance test with realistic data sizes
7. Add proper TypeScript types for all data structures