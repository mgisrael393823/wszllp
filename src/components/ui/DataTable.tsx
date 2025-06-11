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
} from './shadcn-table';
import Button from './Button';
import { Checkbox } from './shadcn-checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './shadcn-dropdown-menu';
import { LoadingState, ErrorState } from './StateComponents';
import { DataTableProps } from '../../types/table.types';
import { TextFilter } from './table-filters/TextFilter';
import { SelectFilter } from './table-filters/SelectFilter';
import { DateRangeFilter } from './table-filters/DateRangeFilter';
import { FilterBar, FilterItem } from './FilterBar';
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
    <div 
      className={cn(
        'bg-white rounded-lg shadow-sm border border-neutral-200',
        className
      )}
      data-testid="data-table"
    >
      {/* Filters section */}
      {table.getAllColumns().some((column) => 
        column.getCanFilter() && column.columnDef.meta?.filterVariant
      ) && (
        <div className="p-4 bg-neutral-50/50 border-b border-neutral-200" data-testid="table-filters">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-700">Filters</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  title="Show or hide table columns"
                  data-testid="column-visibility-toggle"
                >
                  <Columns3 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
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
          
          <FilterBar>
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  column.getCanFilter() && column.columnDef.meta?.filterVariant
              )
              .map((column) => (
                <FilterItem 
                  key={column.id} 
                  label={column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                  span={column.columnDef.meta?.filterVariant === 'date' ? 2 : 1}
                >
                  {renderColumnFilter(column)}
                </FilterItem>
              ))}
          </FilterBar>
        </div>
      )}

      {/* Table section */}
      <div className="overflow-x-auto">
        <Table data-testid="table-content">
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

      {/* Pagination and info section */}
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-neutral-200 bg-neutral-50/30" data-testid="table-pagination">
          {/* Row selection info */}
          <div className="text-sm text-neutral-500 order-2 sm:order-1">
            {enableRowSelection ? (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </>
            ) : (
              <>
                Showing {table.getRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} results
              </>
            )}
          </div>
          
          {/* Pagination controls */}
          <div className="flex items-center justify-center sm:justify-end order-1 sm:order-2">
            {/* Page info */}
            <span className="text-sm text-neutral-600 mr-4">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            
            {/* Navigation buttons */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-md border border-neutral-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                title="First page"
                data-testid="pagination-first"
                aria-label="Go to first page"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="11,17 6,12 11,7"></polyline>
                  <polyline points="18,17 13,12 18,7"></polyline>
                </svg>
              </button>
              
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-md border border-neutral-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                title="Previous page"
                data-testid="pagination-previous"
                aria-label="Go to previous page"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>
              
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                data-testid="pagination-next"
                aria-label="Go to next page"
                className="p-2 rounded-md border border-neutral-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                title="Next page"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
              
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-md border border-neutral-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                title="Last page"
                data-testid="pagination-last"
                aria-label="Go to last page"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="13,17 18,12 13,7"></polyline>
                  <polyline points="6,17 11,12 6,7"></polyline>
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}