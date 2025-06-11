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