/**
 * Design Tokens
 * 
 * This file contains all design tokens for the application.
 * These values are primarily used for reference since the actual implementation
 * is through Tailwind CSS classes. This file helps document the system.
 */

// Color Palette
export const colors = {
  // Primary - Professional blue
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
  // Secondary - Complementary teal
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
    950: '#042F2E',
  },
  // Accent - Amber for highlighting
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
  // Neutral - Gray for text and backgrounds
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  // Semantic colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

// Typography
export const typography = {
  // Font sizes (in rems)
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing
export const spacing = {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '1.5': '0.375rem',  // 6px 
  '2': '0.5rem',      // 8px
  '2.5': '0.625rem',  // 10px
  '3': '0.75rem',     // 12px
  '3.5': '0.875rem',  // 14px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '8': '2rem',        // 32px
  '10': '2.5rem',     // 40px
  '12': '3rem',       // 48px
  '16': '4rem',       // 64px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
};

// Shadows
export const shadows = {
  'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
  'sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  'none': 'none',
};

// Z-index layers
export const zIndices = {
  '0': 0,     // Base layer
  '10': 10,   // Cards, panels 
  '20': 20,   // Sticky headers
  '30': 30,   // Floating elements
  '40': 40,   // Dropdowns, tooltips
  '50': 50,   // Modal backgrounds
  '60': 60,   // Modals
  '70': 70,   // Toasts, notifications
};

// Border radius
export const borderRadius = {
  'none': '0',
  'sm': '0.125rem',   // 2px
  'DEFAULT': '0.25rem', // 4px
  'md': '0.375rem',   // 6px
  'lg': '0.5rem',     // 8px
  'xl': '0.75rem',    // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  'full': '9999px',
};

// Semantic naming map for spacing
export const semanticSpacing = {
  // Content spacing
  contentCompact: spacing['4'],     // 16px
  contentNormal: spacing['6'],      // 24px
  contentRelaxed: spacing['8'],     // 32px
  
  // Layout spacing
  layoutCompact: spacing['6'],      // 24px
  layoutNormal: spacing['8'],       // 32px
  layoutRelaxed: spacing['12'],     // 48px
  
  // Component spacing
  componentTight: spacing['2'],     // 8px
  componentNormal: spacing['4'],    // 16px
  componentRelaxed: spacing['6'],   // 24px
  
  // Form spacing
  formFieldGap: spacing['6'],       // 24px
  formGroupGap: spacing['8'],       // 32px
  formSectionGap: spacing['12'],    // 48px
  
  // Text spacing
  textGapTight: spacing['1'],       // 4px
  textGapNormal: spacing['2'],      // 8px
  textGapRelaxed: spacing['4'],     // 16px
};

// Elevation system mapping
export const elevation = {
  // Functional mapping of elevation levels to shadow and z-index
  base: { 
    shadow: shadows.none, 
    zIndex: zIndices['0'], 
    description: 'Base document level' 
  },
  raised: { 
    shadow: shadows.sm, 
    zIndex: zIndices['10'], 
    description: 'Slightly raised elements (cards, panels)' 
  },
  sticky: { 
    shadow: shadows.md, 
    zIndex: zIndices['20'], 
    description: 'Sticky UI elements (headers, navigation)' 
  },
  floating: { 
    shadow: shadows.lg, 
    zIndex: zIndices['30'], 
    description: 'Floating elements (popovers, dropdowns)' 
  },
  overlay: { 
    shadow: shadows.xl, 
    zIndex: zIndices['50'], 
    description: 'Overlay backgrounds' 
  },
  modal: { 
    shadow: shadows['2xl'], 
    zIndex: zIndices['60'], 
    description: 'Modal dialogs' 
  },
  notification: { 
    shadow: shadows.lg, 
    zIndex: zIndices['70'], 
    description: 'Notifications and alerts' 
  },
};

// Component specific tokens
export const components = {
  // Button variants
  button: {
    sizes: {
      xs: {
        padding: `${spacing['1']} ${spacing['2']}`,
        fontSize: typography.fontSize.xs,
        borderRadius: borderRadius.sm,
      },
      sm: {
        padding: `${spacing['1.5']} ${spacing['3']}`,
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.DEFAULT,
      },
      md: {
        padding: `${spacing['2']} ${spacing['4']}`,
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.DEFAULT,
      },
      lg: {
        padding: `${spacing['3']} ${spacing['6']}`,
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.lg,
      },
    },
  },

  // Card variants
  card: {
    padding: {
      compact: {
        body: spacing['4'],
        header: spacing['4'],
        footer: spacing['4'],
      },
      normal: {
        body: spacing['6'],
        header: spacing['6'],
        footer: spacing['6'],
      },
    },
  },

  // Form spacing
  form: {
    verticalSpacing: spacing['6'],
    horizontalSpacing: spacing['4'],
    labelSpacing: spacing['1'],
    helpTextSpacing: spacing['1'],
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export default {
  colors,
  typography,
  spacing,
  shadows,
  zIndices,
  borderRadius,
  semanticSpacing,
  elevation,
  components,
  breakpoints,
};