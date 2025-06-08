import React from 'react';
import Typography from './Typography';

interface PageCardProps {
  children: React.ReactNode;
  /** Optional page title for the header */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional action button/element for top-right */
  primaryAction?: React.ReactNode;
  /** Whether to include tab navigation area */
  withTabs?: boolean;
  /** Tab content when withTabs is true */
  tabContent?: React.ReactNode;
  /** Maximum width of the container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  /** Whether to include the background wrapper */
  withBackground?: boolean;
  /** Test ID for Cypress testing */
  'data-cy'?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl'
};

export const PageCard: React.FC<PageCardProps> = ({
  children,
  title,
  subtitle,
  primaryAction,
  withTabs = false,
  tabContent,
  maxWidth = '6xl',
  withBackground = true,
  'data-cy': dataCy
}) => {
  const cardContent = (
    <div 
      className="bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden"
      data-cy={dataCy}
    >
      {/* Header Section - only render if title provided */}
      {title && (
        <header className="px-content-normal sm:px-content-comfortable lg:px-content-spacious py-content-comfortable bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Typography variant="h1" weight="bold" className="text-xl sm:text-2xl">{title}</Typography>
              {subtitle && (
                <Typography variant="body2" color="medium" className="mt-1">{subtitle}</Typography>
              )}
            </div>
            {primaryAction && (
              <div className="flex-shrink-0">
                {primaryAction}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Tab Navigation Area */}
      {withTabs && tabContent && (
        <nav className="border-b border-neutral-100" role="tablist">
          {tabContent}
        </nav>
      )}

      {/* Main Content Area */}
      <main className="px-content-normal sm:px-content-comfortable lg:px-content-spacious py-content-comfortable">
        {children}
      </main>
    </div>
  );

  if (!withBackground) {
    return cardContent;
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-content-normal sm:py-content-spacious">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-content-normal sm:px-content-comfortable`}>
        {cardContent}
      </div>
    </div>
  );
};

export default PageCard;