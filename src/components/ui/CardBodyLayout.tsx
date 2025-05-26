import React from 'react';
import { cn } from '@/lib/utils';

interface CardBodyLayoutProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Standardized spacing between card content elements
   * - tight: 8px gaps (for dense information)
   * - normal: 16px gaps (default, balanced)
   * - relaxed: 24px gaps (for featured content)
   */
  spacing?: 'tight' | 'normal' | 'relaxed';
  /**
   * Whether to fill available height with flex-1
   * Ensures consistent card heights across grid layouts
   */
  fillHeight?: boolean;
}

/**
 * Unified card body layout component that enforces consistent spacing
 * and structure across all card variants.
 * 
 * This component ensures:
 * - Consistent vertical rhythm between elements
 * - Uniform card heights when fillHeight is true
 * - Systematic spacing scale across all card types
 */
const CardBodyLayout: React.FC<CardBodyLayoutProps> = ({
  children,
  className = '',
  spacing = 'normal',
  fillHeight = false,
}) => {
  // Systematic spacing scale based on 4px grid
  const spacingStyles = {
    tight: 'space-y-2',    // 8px - for dense data cards
    normal: 'space-y-4',   // 16px - standard spacing
    relaxed: 'space-y-6',  // 24px - for featured cards
  };

  return (
    <div
      className={cn(
        // Base layout structure
        'flex flex-col',
        
        // Systematic spacing
        spacingStyles[spacing],
        
        // Optional height filling for consistent card heights
        fillHeight && 'flex-1',
        
        // Custom className
        className
      )}
    >
      {children}
    </div>
  );
};

export default CardBodyLayout;