import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

function Table<T>({
  data,
  columns,
  keyField,
  onRowClick,
  className = '',
  emptyMessage = 'No data available',
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

  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => {
              const accessor = typeof column.accessor === 'function' ? null : column.accessor;
              const isSortable = column.sortable && accessor !== null;
              
              return (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  onClick={() => accessor && handleSort(accessor)}
                >
                  <div className={`flex items-center ${isSortable ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                    {column.header}
                    {isSortable && (
                      <span className="ml-1 text-gray-400">
                        {getSortIcon(accessor)}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item) => (
            <tr
              key={String(item[keyField])}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((column, cellIndex) => {
                const value = typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : item[column.accessor];
                  
                return (
                  <td key={cellIndex} className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}>
                    {value as React.ReactNode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;