import React, { useState, useEffect } from 'react';
import { 
  Briefcase, FileClock, FileText, Truck, CreditCard, 
  Calendar, Users, Video, ChevronDown, Upload,
  Settings, GitBranch, FilePlus, FileCode,
  Bell, Palette, Home, Clock, LayoutDashboard, 
  HelpCircle, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  count?: number;
  description?: string;
  shortcut?: string;
  children?: NavItem[];
}

// Define navigation structure with hierarchical grouping - simplified for MVP
const createNavStructure = (): NavItem[] => [
  { 
    label: 'Dashboard', 
    value: 'dashboard', 
    icon: <LayoutDashboard size={20} />,
    description: 'Overview of your workspace'
  },
  { 
    label: 'Cases', 
    value: 'cases', 
    icon: <Briefcase size={20} />,
    description: 'Manage your legal cases',
    children: [
      { 
        label: 'Hearings', 
        value: 'hearings', 
        icon: <Clock size={20} />,
        description: 'Upcoming court appearances'
      }
    ]
  },
  { 
    label: 'Documents', 
    value: 'documents', 
    icon: <FileText size={20} />,
    description: 'Case documents and files',
    children: [
      { 
        label: 'eFiling', 
        value: 'efile', 
        icon: <Upload size={20} />,
        description: 'Electronic court filings'
      },
      { 
        label: 'Service Logs', 
        value: 'service-logs', 
        icon: <Truck size={20} />,
        description: 'Service of process tracking'
      }
    ]
  },
  { 
    label: 'Invoices', 
    value: 'invoices', 
    icon: <CreditCard size={20} />,
    description: 'Billing and payments'
  },
  { 
    label: 'Contacts', 
    value: 'contacts', 
    icon: <Users size={20} />,
    description: 'Clients and other contacts'
  },
  { 
    label: 'Admin', 
    value: 'admin', 
    icon: <Settings size={20} />,
    description: 'System administration'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  isCollapsed = false,
  activeSection, 
  onSectionChange 
}) => {
  // Favorites functionality has been removed
  
  // Track recently visited sections
  const [recentSections, setRecentSections] = useState<string[]>([]);
  
  // Track expanded nav panels (parent items)
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  // Navigation structure
  const navStructure = createNavStructure();
  
  // Update recent sections when active section changes
  useEffect(() => {
    if (activeSection && !recentSections.includes(activeSection)) {
      setRecentSections(prev => [activeSection, ...prev.filter(s => s !== activeSection).slice(0, 4)]);
    }
    
    // Expand parent panel of active section
    const findParentItem = (items: NavItem[], value: string, parent?: string): string | undefined => {
      for (const item of items) {
        if (item.value === value) return parent;
        if (item.children) {
          const result = findParentItem(item.children, value, item.value);
          if (result) return result;
        }
      }
      return undefined;
    };
    
    const parentItem = findParentItem(navStructure, activeSection);
    if (parentItem && !expandedPanels.includes(parentItem)) {
      setExpandedPanels(prev => [...prev, parentItem]);
    }
  }, [activeSection, navStructure, recentSections]);

  // Toggle expansion of a navigation panel
  const togglePanel = (panel: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setExpandedPanels(prev => 
      prev.includes(panel) 
        ? prev.filter(p => p !== panel) 
        : [...prev, panel]
    );
  };

  // Favorite functionality has been removed

  // Find all nav items (flattened) for searching
  const getAllNavItems = (items: NavItem[] = navStructure): NavItem[] => {
    return items.reduce((acc: NavItem[], item) => {
      acc.push(item);
      if (item.children?.length) {
        acc.push(...getAllNavItems(item.children));
      }
      return acc;
    }, []);
  };

  // Get a specific nav item by value
  const getNavItemByValue = (value: string): NavItem | undefined => {
    return getAllNavItems().find(item => item.value === value);
  };

  // Render a navigation item with consistent spacing
  const renderNavItem = (item: NavItem, depth = 0, isStandalone = false) => {
    const isExpanded = expandedPanels.includes(item.value);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.value} className={isStandalone ? "mb-0.5" : ""}>
        <div
          onClick={() => {
            onSectionChange(item.value);
            if (hasChildren && !isCollapsed) {
              togglePanel(item.value);
            }
          }}
          className={`
            flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-left cursor-pointer
            ${activeSection === item.value 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-neutral-700 hover:bg-neutral-50'}
            ${depth > 0 ? 'pl-6' : 'pl-3'} 
          `}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSectionChange(item.value);
              if (hasChildren && !isCollapsed) {
                togglePanel(item.value);
              }
            }
          }}
          title={isCollapsed ? `${item.label}${item.description ? ` - ${item.description}` : ''}` : undefined}
        >
          <span className={`${isCollapsed ? '' : 'mr-2'} text-neutral-500`} aria-hidden="true">{item.icon}</span>
          
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              
              {item.count !== undefined && (
                <span className="ml-auto bg-primary-100 text-primary-600 py-0.5 px-2 rounded-full text-xs">
                  {item.count}
                </span>
              )}
              
              {item.shortcut && (
                <span className="ml-auto text-neutral-400 text-xs">{item.shortcut}</span>
              )}
              
              {hasChildren && !isCollapsed && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePanel(item.value, e);
                  }}
                  className="ml-1 text-neutral-400 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' || e.key === ' ') {
                      togglePanel(item.value, e);
                    }
                  }}
                  aria-label={isExpanded ? "Collapse section" : "Expand section"}
                >
                  <ChevronRight
                    size={16}
                    className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                </span>
              )}
              
            </>
          )}
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-5 pl-2 mt-1 border-l border-neutral-200 space-y-1">
            {item.children?.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Favorites section has been removed

  // Recent section has been removed

  // Render the main navigation
  const renderMainNav = () => {
    return (
      <div className="space-y-3">
        {!isCollapsed && (
          <div className="px-3 py-2 text-left">
            <span className="text-sm font-semibold text-neutral-700">Main Navigation</span>
          </div>
        )}
        
        <div className="space-y-1">
          {navStructure.map(item => renderNavItem(item))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-20 bg-white border-r border-neutral-200 
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Sidebar header with 24px horizontal padding */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-200">
        {!isCollapsed ? (
          <h2 className="text-lg font-semibold text-neutral-800">Navigation</h2>
        ) : (
          <div className="w-full flex">
            <Home size={24} className="text-primary-600" />
          </div>
        )}
      </div>
      
      {/* Sidebar content with 16px padding when expanded, 8px when collapsed */}
      <div className={`overflow-y-auto h-[calc(100vh-4rem)] ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {/* Navigation with 12px spacing between sections */}
        <nav className="space-y-3">
          {renderMainNav()}
        </nav>
        
        {/* Help section */}
        <div className="mt-6 pt-4 border-t border-neutral-200">
          {isCollapsed ? (
            <div 
              role="button" 
              tabIndex={0}
              className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-start text-primary-600 cursor-pointer"
              onClick={() => window.open('/support', '_blank')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  window.open('/support', '_blank');
                }
              }}
              aria-label="Get help"
            >
              <HelpCircle size={20} />
            </div>
          ) : (
            <div className="px-4 py-4 bg-primary-50 rounded-lg text-left">
              <h3 className="text-sm font-medium text-primary-800">Need Help?</h3>
              <p className="mt-1 text-xs text-primary-600">
                Contact support for assistance with your legal case management system.
              </p>
              <a href="#" className="mt-2 block text-xs font-medium text-primary-700 hover:text-primary-800 text-left">
                Contact Support
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;