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
    <div className="bg-amber-500 text-white font-medium shadow-md w-full">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-center">
        <span>DEMO MODE - Sample Data for Demonstration Purposes</span>
      </div>
    </div>
  );
};

export default SandboxIndicator;