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
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium shadow-lg w-full">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">🧪</span>
          <span className="font-semibold">DEMO MODE</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline text-blue-100">
            Enhanced E-Filing Demo • Phase A & B Features • Non-Functional Tyler Integration
          </span>
        </div>
        <div className="text-xs text-blue-200 mt-1 sm:hidden">
          Enhanced E-Filing Demo - All features visible, non-functional
        </div>
      </div>
    </div>
  );
};

export default SandboxIndicator;