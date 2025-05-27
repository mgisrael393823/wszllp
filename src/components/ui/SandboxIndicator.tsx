import React from 'react';
import { useSandboxMode } from '@/hooks/useSandboxMode';

/**
 * Visual indicator when user is in sandbox/demo mode
 * Shows at top of application to clearly indicate demo environment
 */
export const SandboxIndicator: React.FC = () => {
  const { isSandbox, isLoading } = useSandboxMode();

  if (isLoading || !isSandbox) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center font-medium shadow-md">
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">🧪</span>
        <span>DEMO MODE - Sample Data for Demonstration Purposes</span>
        <span className="text-lg">🧪</span>
      </div>
    </div>
  );
};

export default SandboxIndicator;