import React from 'react';
import { 
  Briefcase, FileText, CreditCard, Users, Settings,
  Home, LayoutDashboard, HelpCircle
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

// Define navigation structure - flat structure with top-level pages only
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
    description: 'Manage your legal cases'
  },
  { 
    label: 'Documents', 
    value: 'documents', 
    icon: <FileText size={20} />,
    description: 'Case documents and files'
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
  // Navigation structure
  const navStructure = createNavStructure();
  
  // Helper function to determine if a nav item should be highlighted
  // based on current route (supports child routes)
  const isNavItemActive = (itemValue: string): boolean => {
    if (activeSection === itemValue) return true;
    
    // Special handling for parent pages with child routes
    if (itemValue === 'cases' && ['hearings'].includes(activeSection)) {
      return true;
    }
    if (itemValue === 'documents' && ['efile', 'service-logs'].includes(activeSection)) {
      return true;
    }
    
    return false;
  };


  // Render a navigation item - simplified for flat structure
  const renderNavItem = (item: NavItem) => {
    const isActive = isNavItemActive(item.value);
    
    return (
      <div key={item.value}>
        <div
          onClick={() => onSectionChange(item.value)}
          className={`
            flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-left cursor-pointer
            ${isActive 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-neutral-700 hover:bg-neutral-50'}
          `}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSectionChange(item.value);
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
            </>
          )}
        </div>
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