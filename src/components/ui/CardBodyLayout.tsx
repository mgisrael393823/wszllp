import React from 'react';
import { cn } from '@/lib/utils';
import { useCardSize } from './CardContext';

interface CardBodyLayoutProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Standardized spacing between card content elements
   * - tight: Uses card size's itemGap
   * - normal: Uses card size's gap
   * - relaxed: Uses card size's sectionGap
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
  const { config } = useCardSize();
  
  // Map spacing prop to the appropriate config value
  const spacingStyles = {
    tight: config.spacing.content,
    normal: config.spacing.section,
    relaxed: config.spacing.header,
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