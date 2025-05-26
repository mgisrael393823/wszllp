import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import Typography from './Typography';

type SortDirection = 'asc' | 'desc' | null;
type TableSize = 'sm' | 'md' | 'lg';
type TableVariant = 'default' | 'striped' | 'bordered' | 'borderless' | 'unstyled';
type TableDensity = 'compact' | 'default' | 'relaxed';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  align?: 'left' | 'center' | 'right';
  renderHeader?: (column: Column<T>) => React.ReactNode;
  renderCell?: (value: unknown, item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  emptyMessage?: string | React.ReactNode;
  variant?: TableVariant;
  size?: TableSize;
  density?: TableDensity;
  caption?: string;
  isLoading?: boolean;
  stickyHeader?: boolean;
  highlightOnHover?: boolean;
  selectedRow?: T | null;
  selectionKey?: keyof T;
  zebra?: boolean;
  footer?: React.ReactNode;
}

function Table<T>({
  data,
  columns,
  keyField,
  onRowClick,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  emptyMessage = 'No data available',
  variant = 'default',
  size = 'md',
  density = 'default',
  caption,
  isLoading = false,
  stickyHeader = false,
  highlightOnHover = true,
  selectedRow = null,
  selectionKey = keyField,
  zebra = false,
  footer,
}: TableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (accessor: keyof T) => {
    if (!columns.find(col => col.accessor === accessor)?.sortable) return;
    
    let direction: SortDirection = 'asc';
    
    if (sortField === accessor) {
      if (sortDirection === 'asc') direction = 'desc';
      else if (sortDirection === 'desc') direction = null;
      else direction = 'asc';
    }
    
    setSortField(direction === null ? null : accessor);
    setSortDirection(direction);
  };

  const getSortIcon = (accessor: keyof T) => {
    if (sortField !== accessor) return <ChevronsUpDown size={16} />;
    if (sortDirection === 'asc') return <ChevronUp size={16} />;
    return <ChevronDown size={16} />;
  };

  const sortedData = React.useMemo(() => {
    if (!sortField || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      return sortDirection === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (bValue < aValue ? -1 : 1);
    });
  }, [data, sortField, sortDirection]);

  // Table variant styles
  const variantStyles: Record<TableVariant, string> = {
    default: 'border border-neutral-200 rounded-lg',
    striped: 'border border-neutral-200 rounded-lg [&_tbody_tr:nth-child(even)]:bg-neutral-50',
    bordered: 'border border-neutral-200 rounded-lg [&_th]:border [&_td]:border [&_th]:border-neutral-200 [&_td]:border-neutral-200',
    borderless: 'shadow-sm rounded-lg',
    unstyled: '',
  };

  // Table size styles
  const sizeStyles: Record<TableSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Table density (cell padding) styles
  const densityStyles: Record<TableDensity, { th: string, td: string }> = {
    compact: { th: 'px-3 py-2', td: 'px-3 py-2' },
    default: { th: 'px-4 py-3', td: 'px-4 py-3' },
    relaxed: { th: 'px-6 py-4', td: 'px-6 py-4' },
  };

  // Loading state UI
  const renderLoadingState = () => (
    <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-2"></div>
        <Typography variant="body2" color="light">Loading data...</Typography>
      </div>
    </div>
  );

  // Empty state UI
  const renderEmptyState = () => (
    <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
      {typeof emptyMessage === 'string' ? (
        <Typography color="light">{emptyMessage}</Typography>
      ) : (
        emptyMessage
      )}
    </div>
  );

  if (data.length === 0 && !isLoading) {
    return renderEmptyState();
  }

  const tableHeaderClass = `${headerClassName} bg-neutral-50 text-left font-medium text-neutral-500 uppercase tracking-wider ${stickyHeader ? 'sticky top-0 z-10' : ''}`;
  
  const getRowStyles = (item: T, index: number) => {
    const isSelected = selectedRow && selectedRow[selectionKey] === item[selectionKey];
    
    return [
      onRowClick || highlightOnHover ? 'hover:bg-neutral-50' : '',
      onRowClick ? 'cursor-pointer' : '',
      isSelected ? 'bg-primary-50' : '',
      zebra && index % 2 !== 0 ? 'bg-neutral-50' : '',
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={`overflow-hidden relative ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {caption && (
        <caption className="p-4 text-left">
          <Typography variant="subtitle2">{caption}</Typography>
        </caption>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className={tableHeaderClass}>
            <tr>
              {columns.map((column, index) => {
                const accessor = typeof column.accessor === 'function' ? null : column.accessor;
                const isSortable = column.sortable && accessor !== null;
                const alignClass = column.align ? `text-${column.align}` : 'text-left';
                
                return (
                  <th
                    key={index}
                    className={`${densityStyles[density].th} ${alignClass} ${column.headerClassName || ''}`}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={() => accessor && isSortable && handleSort(accessor)}
                    scope="col"
                  >
                    {column.renderHeader ? (
                      column.renderHeader(column)
                    ) : (
                      <div className={`flex items-center ${isSortable ? 'cursor-pointer hover:text-neutral-700' : ''}`}>
                        <span>{column.header}</span>
                        {isSortable && (
                          <span className="ml-1 text-neutral-400">
                            {getSortIcon(accessor)}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-neutral-200 ${bodyClassName}`}>
            {sortedData.map((item, rowIndex) => (
              <tr
                key={`${String(item[keyField])}-${rowIndex}`}
                className={getRowStyles(item, rowIndex)}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column, cellIndex) => {
                  const value = typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : item[column.accessor];
                  
                  const alignClass = column.align ? `text-${column.align}` : 'text-left';
                  
                  return (
                    <td 
                      key={cellIndex} 
                      className={`${densityStyles[density].td} ${alignClass} ${column.cellClassName || ''}`}
                    >
                      {column.renderCell 
                        ? column.renderCell(value, item, rowIndex)
                        : value as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot className="bg-neutral-50 border-t border-neutral-200">
              {footer}
            </tfoot>
          )}
        </table>
      </div>
      {isLoading && renderLoadingState()}
    </div>
  );
}

export default Table;