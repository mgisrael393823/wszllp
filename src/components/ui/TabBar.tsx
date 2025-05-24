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
    <div className={`bg-neutral-50 p-1 rounded-lg border border-neutral-200 shadow-sm ${className}`}>
      <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab)}
              disabled={isDisabled}
              className={`
                relative px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200
                flex items-center space-x-2 min-w-0 flex-shrink-0 whitespace-nowrap
                ${
                  isActive
                    ? 'bg-white text-primary-700 shadow-sm border border-neutral-200'
                    : isDisabled
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50 cursor-pointer'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                    ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
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