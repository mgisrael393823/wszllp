import React from 'react';

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
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      data-cy={dataCy}
    >
      {/* Header Section - only render if title provided */}
      {title && (
        <header className="px-4 sm:px-6 lg:px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
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
        <nav className="border-b border-gray-100" role="tablist">
          {tabContent}
        </nav>
      )}

      {/* Main Content Area */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );

  if (!withBackground) {
    return cardContent;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-8">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6`}>
        {cardContent}
      </div>
    </div>
  );
};

export default PageCard;