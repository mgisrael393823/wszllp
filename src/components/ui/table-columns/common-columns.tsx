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
        const date = new Date(value as string);
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