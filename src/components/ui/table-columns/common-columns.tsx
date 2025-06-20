import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar, Clock, User, FileText, ExternalLink } from 'lucide-react';
import { getStatusColor } from '../../../utils/statusColors';
import { formatCurrency } from '../../../utils/utils';

// Status configurations for different domains
export const statusConfigs = {
  case: {
    active: { label: 'Active', variant: 'bg-green-100 text-green-800' },
    'intake scheduled': { label: 'Intake Scheduled', variant: 'bg-blue-100 text-blue-800' },
    'sps not served': { label: 'SPS Not Served', variant: 'bg-yellow-100 text-yellow-800' },
    closed: { label: 'Closed', variant: 'bg-neutral-100 text-neutral-800' },
  },
  document: {
    pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800' },
    served: { label: 'Served', variant: 'bg-green-100 text-green-800' },
    failed: { label: 'Failed', variant: 'bg-red-100 text-red-800' },
  },
  hearing: {
    pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completed', variant: 'bg-green-100 text-green-800' },
    continued: { label: 'Continued', variant: 'bg-blue-100 text-blue-800' },
    dismissed: { label: 'Dismissed', variant: 'bg-neutral-100 text-neutral-800' },
  },
  invoice: {
    paid: { label: 'Paid', variant: 'bg-green-100 text-green-800' },
    unpaid: { label: 'Unpaid', variant: 'bg-yellow-100 text-yellow-800' },
    overdue: { label: 'Overdue', variant: 'bg-red-100 text-red-800' },
  },
  service: {
    success: { label: 'Success', variant: 'bg-green-100 text-green-800' },
    failed: { label: 'Failed', variant: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800' },
  },
} as const;

export const commonColumns = {
  // Basic status column with legacy support
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

  // Enhanced status column with domain-specific configurations
  enhancedStatus: <T extends Record<string, any>>(
    field: keyof T,
    domain: keyof typeof statusConfigs,
    header: string = 'Status'
  ): ColumnDef<T> => ({
    accessorKey: field as string,
    header,
    cell: ({ row }) => {
      const value = (row.getValue(field as string) as string)?.toLowerCase();
      const config = statusConfigs[domain];
      const statusInfo = config[value as keyof typeof config] || {
        label: value,
        variant: 'bg-neutral-100 text-neutral-800',
      };
      
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.variant}`}
        >
          {statusInfo.label}
        </span>
      );
    },
    meta: {
      filterVariant: 'select',
      filterOptions: Object.values(config).map(({ label }) => ({
        label,
        value: label.toLowerCase(),
      })),
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

  // Date with time display option
  dateTime: <T extends Record<string, any>>(
    field: keyof T,
    header: string = 'Date',
    showTime: boolean = false
  ): ColumnDef<T> => ({
    accessorKey: field as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(field as string);
      if (!value) return <span className="text-neutral-400">Not set</span>;

      try {
        const date = new Date(value as string);
        const dateFormat = showTime ? 'MMM dd, yyyy h:mm a' : 'MMM dd, yyyy';
        return (
          <div className="flex items-center gap-1 text-neutral-600">
            {showTime ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            <span>{format(date, dateFormat)}</span>
          </div>
        );
      } catch {
        return <span className="text-neutral-400">Invalid date</span>;
      }
    },
    meta: {
      filterVariant: 'date-range',
    },
  }),

  // Case title formatter for "Plaintiff v. Defendant" pattern
  caseTitle: <T extends Record<string, any>>(
    plaintiffField: keyof T,
    defendantField: keyof T,
    header: string = 'Case'
  ): ColumnDef<T> => ({
    id: `${String(plaintiffField)}_${String(defendantField)}_title`,
    header,
    cell: ({ row }) => {
      const plaintiff = row.getValue(plaintiffField as string) as string;
      const defendant = row.getValue(defendantField as string) as string;
      
      if (!plaintiff || !defendant) {
        return <span className="text-neutral-400">Incomplete case</span>;
      }
      
      return (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-400" />
          <span className="font-medium">{plaintiff} v. {defendant}</span>
        </div>
      );
    },
    meta: {
      filterVariant: 'text',
    },
  }),

  // Contact/User display with avatar and role
  contactDisplay: <T extends Record<string, any>>(
    nameField: keyof T,
    header: string = 'Contact',
    roleField?: keyof T,
    avatarField?: keyof T,
    showAvatar: boolean = true
  ): ColumnDef<T> => ({
    accessorKey: nameField as string,
    header,
    cell: ({ row }) => {
      const name = row.getValue(nameField as string) as string;
      const role = roleField ? (row.getValue(roleField as string) as string) : null;
      const avatar = avatarField ? (row.getValue(avatarField as string) as string) : null;
      
      return (
        <div className="flex items-center gap-3">
          {showAvatar && (
            <div className="flex-shrink-0">
              {avatar ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={avatar}
                  alt={name}
                  loading="lazy"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-neutral-500" />
                </div>
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900 truncate">{name}</p>
            {role && (
              <p className="text-xs text-neutral-500 truncate">{role}</p>
            )}
          </div>
        </div>
      );
    },
    meta: {
      filterVariant: 'text',
    },
  }),

  // File link with icon and download functionality
  fileLink: <T extends Record<string, any>>(
    urlField: keyof T,
    nameField: keyof T,
    header: string = 'File',
    typeField?: keyof T
  ): ColumnDef<T> => ({
    accessorKey: nameField as string,
    header,
    cell: ({ row }) => {
      const url = row.getValue(urlField as string) as string;
      const name = row.getValue(nameField as string) as string;
      const type = typeField ? (row.getValue(typeField as string) as string) : null;
      
      if (!url || !name) {
        return <span className="text-neutral-400">No file</span>;
      }
      
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
        >
          <FileText className="w-4 h-4" />
          <span className="truncate">{name}</span>
          {type && (
            <span className="text-xs text-neutral-500 uppercase">{type}</span>
          )}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    },
    meta: {
      filterVariant: 'text',
    },
  }),

  // Enhanced currency with icon
  enhancedCurrency: <T extends Record<string, any>>(
    field: keyof T,
    header: string = 'Amount',
    showIcon: boolean = true
  ): ColumnDef<T> => ({
    accessorKey: field as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(field as string) as number;
      const formattedValue = formatCurrency(value);
      
      return (
        <div className="flex items-center gap-1 justify-end font-mono">
          {showIcon && <span className="text-green-600">$</span>}
          <span>{formattedValue.replace('$', '')}</span>
        </div>
      );
    },
    meta: {
      filterVariant: 'range',
      align: 'right',
    },
  }),
};