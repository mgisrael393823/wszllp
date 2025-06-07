import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from './shadcn-dialog';
import Button from './Button';
import { cn } from '@/lib/utils';

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ModalVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'warning' | 'error' | 'success';
type ModalPosition = 'center' | 'top' | 'right' | 'bottom' | 'left';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  position?: ModalPosition;
  closeOnClickOutside?: boolean;
  disableEscapeKey?: boolean;
  hideCloseButton?: boolean;
  preventBodyScroll?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  overlayClassName?: string;
  initialFocus?: React.RefObject<HTMLElement>;
}

/**
 * Modal component that uses Shadcn UI Dialog internally but maintains the original API
 * This ensures backward compatibility with existing code
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  variant = 'default',
  position = 'center',
  closeOnClickOutside = true,
  disableEscapeKey = false,
  hideCloseButton = false,
  className = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  overlayClassName = '',
  initialFocus,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Size classes
  const sizeClasses: Record<ModalSize, string> = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Variant classes
  const variantClasses: Record<ModalVariant, string> = {
    default: 'bg-background',
    primary: 'bg-primary-50 border-l-4 border-l-primary-500',
    secondary: 'bg-secondary-50 border-l-4 border-l-secondary-500',
    accent: 'bg-accent-50 border-l-4 border-l-accent-500',
    warning: 'bg-warning-50 border-l-4 border-l-warning-500',
    error: 'bg-error-50 border-l-4 border-l-error-500',
    success: 'bg-success-50 border-l-4 border-l-success-500',
  };

  // Position classes
  const positionClasses: Record<ModalPosition, string> = {
    center: '', // Default position
    top: 'top-4 translate-y-0 -translate-x-1/2',
    right: 'right-4 translate-x-0 -translate-y-1/2',
    bottom: 'bottom-4 translate-y-0 -translate-x-1/2',
    left: 'left-4 translate-x-0 -translate-y-1/2',
  };

  // Get header styles based on variant
  const getHeaderStyles = () => {
    switch (variant) {
      case 'primary': return 'border-b border-primary-200';
      case 'secondary': return 'border-b border-secondary-200';
      case 'accent': return 'border-b border-accent-200';
      case 'warning': return 'border-b border-warning-200';
      case 'error': return 'border-b border-error-200';
      case 'success': return 'border-b border-success-200';
      default: return 'border-b border-neutral-200';
    }
  };

  // Get footer styles based on variant
  const getFooterStyles = () => {
    switch (variant) {
      case 'primary': return 'bg-primary-50/50 border-t border-primary-200';
      case 'secondary': return 'bg-secondary-50/50 border-t border-secondary-200';
      case 'accent': return 'bg-accent-50/50 border-t border-accent-200';
      case 'warning': return 'bg-warning-50/50 border-t border-warning-200';
      case 'error': return 'bg-error-50/50 border-t border-error-200';
      case 'success': return 'bg-success-50/50 border-t border-success-200';
      default: return 'bg-neutral-50 border-t border-neutral-200';
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modal={!closeOnClickOutside}
    >
      <DialogContent
        ref={modalRef}
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          positionClasses[position],
          className
        )}
        onEscapeKeyDown={(e) => {
          if (disableEscapeKey) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (!closeOnClickOutside) {
            e.preventDefault();
          }
        }}
        hideCloseButton={hideCloseButton}
      >
        <DialogHeader className={cn(getHeaderStyles(), 'pb-2', headerClassName)}>
          {typeof title === 'string' ? (
            <DialogTitle>{title}</DialogTitle>
          ) : (
            title
          )}
          {subtitle && (
            <DialogDescription className="mt-1">{subtitle}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className={cn('py-2', bodyClassName)}>
          {children}
        </div>
        
        {footer && (
          <DialogFooter className={cn(getFooterStyles(), 'py-3 mt-4', footerClassName)}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;