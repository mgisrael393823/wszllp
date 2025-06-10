import React, { createContext, useContext } from 'react';

export type CardSize = 'compact' | 'normal' | 'spacious' | 'featured';

// Comprehensive size configuration with static Tailwind classes
// All classes are explicit to ensure Tailwind JIT compilation
export const cardSizeConfig = {
  compact: {
    // Padding
    padding: { 
      x: 'px-3',                 // 12px
      y: 'py-3'                  // 12px
    },
    // Icon sizing and styling
    icon: {
      size: 'w-4 h-4',           // 16px
      containerPadding: 'p-2',   // 8px
      containerSize: 'w-8 h-8',  // 32px total
    },
    // Typography variants
    typography: {
      title: 'text-base font-semibold tracking-tight',    // 16px
      subtitle: 'text-xs text-neutral-600 leading-relaxed', // 12px
      body: 'text-sm text-neutral-700',                   // 14px
      metric: 'text-2xl font-bold tracking-tight',        // 24px
      caption: 'text-xs text-neutral-500',                // 12px
    },
    // Internal spacing
    spacing: {
      header: 'space-y-3',       // 12px between header elements
      content: 'space-y-2',      // 8px between content items
      section: 'space-y-3',      // 12px between sections
    },
    // Interactive elements
    button: {
      padding: 'px-3 py-2',      // 12px x 8px
      gap: 'gap-2',              // 8px
    },
    // Border radius
    borderRadius: 'rounded-lg',
  },
  normal: {
    // Padding
    padding: { 
      x: 'px-5',                 // 20px
      y: 'py-4'                  // 16px
    },
    // Icon sizing and styling
    icon: {
      size: 'w-5 h-5',           // 20px
      containerPadding: 'p-2.5', // 10px
      containerSize: 'w-10 h-10', // 40px total
    },
    // Typography variants
    typography: {
      title: 'text-lg font-semibold tracking-tight',      // 18px
      subtitle: 'text-sm text-neutral-600 leading-relaxed', // 14px
      body: 'text-base text-neutral-700',                 // 16px
      metric: 'text-3xl font-bold tracking-tight',        // 30px
      caption: 'text-sm text-neutral-500',                // 14px
    },
    // Internal spacing
    spacing: {
      header: 'space-y-4',       // 16px between header elements
      content: 'space-y-3',      // 12px between content items
      section: 'space-y-4',      // 16px between sections
    },
    // Interactive elements
    button: {
      padding: 'px-4 py-2.5',    // 16px x 10px
      gap: 'gap-3',              // 12px
    },
    // Border radius
    borderRadius: 'rounded-xl',
  },
  spacious: {
    // Padding
    padding: { 
      x: 'px-6',                 // 24px
      y: 'py-5'                  // 20px
    },
    // Icon sizing and styling
    icon: {
      size: 'w-6 h-6',           // 24px
      containerPadding: 'p-3',   // 12px
      containerSize: 'w-12 h-12', // 48px total
    },
    // Typography variants
    typography: {
      title: 'text-xl font-semibold tracking-tight',      // 20px
      subtitle: 'text-base text-neutral-600 leading-relaxed', // 16px
      body: 'text-base text-neutral-700',                 // 16px
      metric: 'text-4xl font-bold tracking-tight',        // 36px
      caption: 'text-sm text-neutral-500',                // 14px
    },
    // Internal spacing
    spacing: {
      header: 'space-y-5',       // 20px between header elements
      content: 'space-y-4',      // 16px between content items
      section: 'space-y-5',      // 20px between sections
    },
    // Interactive elements
    button: {
      padding: 'px-5 py-3',      // 20px x 12px
      gap: 'gap-3',              // 12px
    },
    // Border radius
    borderRadius: 'rounded-xl',
  },
  featured: {
    // Padding
    padding: { 
      x: 'px-8',                 // 32px
      y: 'py-6'                  // 24px
    },
    // Icon sizing and styling
    icon: {
      size: 'w-8 h-8',           // 32px
      containerPadding: 'p-4',   // 16px
      containerSize: 'w-16 h-16', // 64px total
    },
    // Typography variants
    typography: {
      title: 'text-2xl font-bold tracking-tight',         // 24px
      subtitle: 'text-lg text-neutral-600 leading-relaxed', // 18px
      body: 'text-lg text-neutral-700',                   // 18px
      metric: 'text-5xl font-bold tracking-tight',        // 48px
      caption: 'text-base text-neutral-500',              // 16px
    },
    // Internal spacing
    spacing: {
      header: 'space-y-6',       // 24px between header elements
      content: 'space-y-5',      // 20px between content items
      section: 'space-y-6',      // 24px between sections
    },
    // Interactive elements
    button: {
      padding: 'px-6 py-3.5',    // 24px x 14px
      gap: 'gap-4',              // 16px
    },
    // Border radius
    borderRadius: 'rounded-2xl',
  },
} as const;

// Context type
interface CardContextType {
  size: CardSize;
  config: typeof cardSizeConfig[CardSize];
}

// Create context with default values
const CardContext = createContext<CardContextType>({
  size: 'normal',
  config: cardSizeConfig.normal,
});

// Provider component
interface CardProviderProps {
  size: CardSize;
  children: React.ReactNode;
}

export const CardProvider: React.FC<CardProviderProps> = ({ size, children }) => {
  const config = cardSizeConfig[size];
  
  return (
    <CardContext.Provider value={{ size, config }}>
      {children}
    </CardContext.Provider>
  );
};

// Hook to use card context
export const useCardSize = () => {
  const context = useContext(CardContext);
  if (!context) {
    // Return default if used outside provider
    return { size: 'normal' as CardSize, config: cardSizeConfig.normal };
  }
  return context;
};

// Utility function to get size config without context (for standalone usage)
export const getCardSizeConfig = (size: CardSize = 'normal') => {
  return cardSizeConfig[size];
};