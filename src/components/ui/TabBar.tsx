import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface TabItem {
  label: string;
  value: string;
  route: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabBarProps {
  tabs: TabItem[];
  className?: string;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = (): string => {
    const currentPath = location.pathname;
    
    // Find exact match first
    const exactMatch = tabs.find(tab => tab.route === currentPath);
    if (exactMatch) return exactMatch.value;
    
    // Find partial match for dynamic routes (e.g., /cases/:id)
    const partialMatch = tabs.find(tab => {
      if (tab.route.includes('/:')) {
        const baseRoute = tab.route.split('/:')[0];
        return currentPath.startsWith(baseRoute) && currentPath !== baseRoute;
      }
      return false;
    });
    
    if (partialMatch) return partialMatch.value;
    
    // Default to first tab if no match
    return tabs[0]?.value || '';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: TabItem) => {
    if (tab.disabled) return;
    navigate(tab.route);
  };

  return (
    <div className={`border-b border-neutral-200 ${className}`}>
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab)}
              disabled={isDisabled}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                ${isActive
                  ? 'border-primary-500 text-primary-600'
                  : isDisabled
                  ? 'border-transparent text-neutral-400 cursor-not-allowed'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 cursor-pointer'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs
                    ${isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-neutral-100 text-neutral-600'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabBar;