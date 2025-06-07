import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSandboxMode } from '@/hooks/useSandboxMode';

export const SandboxBanner: React.FC = () => {
  const { user } = useAuth();
  const { isSandbox, isLoading } = useSandboxMode();
  
  // Don't show banner if still loading or not in sandbox mode  
  if (isLoading || !isSandbox) return null;
  
  return (
    <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm mr-3">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      <span className="text-sm font-semibold">DEMO</span>
      <span className="text-blue-100 text-xs hidden lg:inline">|</span>
      <span className="text-blue-100 text-xs hidden lg:inline">Sample Data</span>
    </div>
  );
};

export default SandboxBanner;