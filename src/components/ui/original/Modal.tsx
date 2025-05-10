import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import Typography from './Typography';

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
  preventBodyScroll = true,
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

  // Manage body scroll lock
  useEffect(() => {
    if (preventBodyScroll && isOpen) {
      // Save current scroll position and focus
      previousFocusRef.current = document.activeElement;
      const scrollY = window.scrollY;
      
      // Add scroll lock
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Remove scroll lock
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Set initial focus
  useEffect(() => {
    if (isOpen) {
      if (initialFocus && initialFocus.current) {
        initialFocus.current.focus();
      } else if (modalRef.current) {
        // Find the first focusable element
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      (previousFocusRef.current as HTMLElement).focus();
    }
  }, [isOpen, initialFocus]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (!disableEscapeKey && event.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, disableEscapeKey]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnClickOutside && 
        modalRef.current && 
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  // Trap focus within the modal
  useEffect(() => {
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        // If shift+tab on first element, move to last element
        if (event.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
        // If tab on last element, move to first element
        else if (!event.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleTabKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
    default: 'bg-white',
    primary: 'bg-primary-50 border-l-4 border-l-primary-500',
    secondary: 'bg-secondary-50 border-l-4 border-l-secondary-500',
    accent: 'bg-accent-50 border-l-4 border-l-accent-500',
    warning: 'bg-warning-50 border-l-4 border-l-warning-500',
    error: 'bg-error-50 border-l-4 border-l-error-500',
    success: 'bg-success-50 border-l-4 border-l-success-500',
  };

  // Position classes
  const positionClasses: Record<ModalPosition, string> = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-16',
    right: 'items-center justify-end',
    bottom: 'items-end justify-center pb-16',
    left: 'items-center justify-start',
  };

  // Get header border color based on variant
  const getHeaderBorderColor = () => {
    switch (variant) {
      case 'primary': return 'border-primary-200';
      case 'secondary': return 'border-secondary-200';
      case 'accent': return 'border-accent-200';
      case 'warning': return 'border-warning-200';
      case 'error': return 'border-error-200';
      case 'success': return 'border-success-200';
      default: return 'border-neutral-200';
    }
  };

  // Get footer background and border color based on variant
  const getFooterStyles = () => {
    switch (variant) {
      case 'primary': return 'bg-primary-50/50 border-primary-200';
      case 'secondary': return 'bg-secondary-50/50 border-secondary-200';
      case 'accent': return 'bg-accent-50/50 border-accent-200';
      case 'warning': return 'bg-warning-50/50 border-warning-200';
      case 'error': return 'bg-error-50/50 border-error-200';
      case 'success': return 'bg-success-50/50 border-success-200';
      default: return 'bg-neutral-50 border-neutral-200';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-60 overflow-y-auto bg-black bg-opacity-50 flex ${positionClasses[position]} p-4 animate-fade-in ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`rounded-lg shadow-xl w-full ${sizeClasses[size]} ${variantClasses[variant]} animate-slide-in ${className}`}
      >
        <div className={`flex justify-between items-start px-6 py-4 border-b ${getHeaderBorderColor()} ${headerClassName}`}>
          <div>
            {typeof title === 'string' ? (
              <Typography variant="h4" id="modal-title">{title}</Typography>
            ) : (
              title
            )}
            {subtitle && (
              <Typography variant="body2" color="light" className="mt-1">{subtitle}</Typography>
            )}
          </div>
          {!hideCloseButton && (
            <Button
              variant="text"
              size="sm"
              onClick={onClose}
              aria-label="Close"
              icon={<X size={18} />}
            />
          )}
        </div>
        
        <div className={`px-6 py-4 ${bodyClassName}`}>{children}</div>
        
        {footer && (
          <div className={`px-6 py-3 border-t flex justify-end space-x-2 ${getFooterStyles()} ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;