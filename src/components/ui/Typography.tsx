import React from 'react';

type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'h5' 
  | 'h6' 
  | 'subtitle1' 
  | 'subtitle2' 
  | 'body1' 
  | 'body2' 
  | 'caption' 
  | 'overline'
  | 'legal';

type TypographyAlign = 'left' | 'center' | 'right' | 'justify';
type TypographyColor = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'accent'
  | 'success' 
  | 'error' 
  | 'warning'
  | 'light' 
  | 'medium' 
  | 'dark';
type TypographyWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

interface TypographyProps {
  variant?: TypographyVariant;
  align?: TypographyAlign;
  color?: TypographyColor;
  weight?: TypographyWeight;
  className?: string;
  gutterBottom?: boolean;
  noWrap?: boolean;
  paragraph?: boolean;
  children: React.ReactNode;
  as?: React.ElementType;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  align = 'left',
  color = 'default',
  weight,
  className = '',
  gutterBottom = false,
  noWrap = false,
  paragraph = false,
  children,
  as,
  ...props
}) => {
  // Map variants to appropriate element types and styles with enhanced typography
  const variantMapping: Record<TypographyVariant, { element: React.ElementType; className: string }> = {
    h1: { element: 'h1', className: 'text-4xl font-extrabold tracking-tight leading-tight' },
    h2: { element: 'h2', className: 'text-3xl font-bold tracking-tight leading-tight' },
    h3: { element: 'h3', className: 'text-2xl font-semibold tracking-normal leading-snug' },
    h4: { element: 'h4', className: 'text-xl font-semibold tracking-normal leading-snug' },
    h5: { element: 'h5', className: 'text-lg font-medium tracking-normal leading-normal' },
    h6: { element: 'h6', className: 'text-base font-medium tracking-normal leading-normal' },
    subtitle1: { element: 'h6', className: 'text-lg font-normal tracking-wide leading-relaxed' },
    subtitle2: { element: 'h6', className: 'text-base font-medium tracking-wide leading-relaxed' },
    body1: { element: 'p', className: 'text-base font-normal tracking-normal leading-relaxed' },
    body2: { element: 'p', className: 'text-sm font-normal tracking-normal leading-relaxed' },
    caption: { element: 'span', className: 'text-xs font-normal tracking-wide' },
    overline: { element: 'span', className: 'text-xs font-semibold uppercase tracking-widest letter-spacing-[0.1em]' },
    legal: { element: 'p', className: 'text-xs font-light tracking-wide leading-relaxed' },
  };

  // Text alignment
  const alignStyles: Record<TypographyAlign, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  // Text colors with improved contrast
  const colorStyles: Record<TypographyColor, string> = {
    default: 'text-neutral-800',
    primary: 'text-primary-700',
    secondary: 'text-secondary-700',
    accent: 'text-accent-600',
    success: 'text-success-700',
    error: 'text-error-700',
    warning: 'text-warning-700',
    light: 'text-neutral-600',
    medium: 'text-neutral-700',
    dark: 'text-neutral-900',
  };

  // Font weights (only applied if explicitly set, otherwise uses variant default)
  const weightStyles: Record<TypographyWeight, string> = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  // Determine component to render
  const Component = as || variantMapping[variant].element;
  
  // Combine all styles
  const styles = [
    variantMapping[variant].className,
    alignStyles[align],
    colorStyles[color],
    weight ? weightStyles[weight] : '',
    gutterBottom ? 'mb-2' : '',
    noWrap ? 'whitespace-nowrap overflow-hidden text-ellipsis' : '',
    paragraph ? 'mb-4' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={styles} {...props}>
      {children}
    </Component>
  );
};

export default Typography;