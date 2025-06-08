import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  title,
  duration = 5000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  // Ensure type is a valid ToastType
  const safeType: ToastType = ['success', 'error', 'warning', 'info'].includes(type) 
    ? type 
    : 'info';

  const backgrounds = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  // Add animation class with fallback
  const animationClass = 'animate-slide-in-right'; // This needs to be defined in Tailwind config

  try {
    return (
      <div
        className={`fixed top-4 right-4 px-4 py-3 rounded-md border-l-4 shadow-md ${
          backgrounds[safeType]
        } max-w-sm z-50 ${animationClass}`}
        role="alert"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[safeType]}</div>
          <div className="ml-3">
            {title && <p className="font-bold">{title}</p>}
            <p className="text-sm">{message}</p>
          </div>
          <div className="ml-auto pl-3">
            <button
              className="inline-flex text-neutral-400 focus:outline-none focus:text-neutral-500 rounded-md"
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering Toast:", error);
    return null; // Fail gracefully
  }
};

export default Toast;