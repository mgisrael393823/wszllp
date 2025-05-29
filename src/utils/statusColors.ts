// Utility functions for case status styling

export type CaseStatus = 'SPS NOT SERVED' | 'SPS PENDING' | 'SEND TO SPS' | 'SPS SERVED';

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'SPS NOT SERVED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'SPS PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'SEND TO SPS':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SPS SERVED':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusBackground = (status: string): string => {
  switch (status) {
    case 'SPS NOT SERVED':
      return 'bg-red-500';
    case 'SPS PENDING':
      return 'bg-yellow-500';
    case 'SEND TO SPS':
      return 'bg-orange-500';
    case 'SPS SERVED':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

// Component for displaying status badge
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  return React.createElement(
    'span',
    {
      className: `px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)} ${className}`
    },
    status
  );
};