import React, { useState } from 'react';
import { 
  Briefcase, FileText, Users, Settings,
  LayoutDashboard, HelpCircle, Calendar, Activity, DollarSign, Database
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
    label: 'Hearings', 
    value: 'hearings', 
    icon: <Calendar size={20} />,
    description: 'Manage court hearings and proceedings'
  },
  { 
    label: 'Documents', 
    value: 'documents', 
    icon: <FileText size={20} />,
    description: 'Case documents and files'
  },
  { 
    label: 'Invoices', 
    value: 'invoices', 
    icon: <DollarSign size={20} />,
    description: 'Manage billing and payments'
  },
  { 
    label: 'Contacts', 
    value: 'contacts', 
    icon: <Users size={20} />,
    description: 'Clients and other contacts'
  },
  { 
    label: 'Activity', 
    value: 'activity', 
    icon: <Activity size={20} />,
    description: 'Recent actions and activity feed'
  },
  { 
    label: 'Data Import', 
    value: 'admin', 
    icon: <Database size={20} />,
    description: 'Import data from Excel or CSV files'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  isCollapsed = false,
  activeSection, 
  onSectionChange 
}) => {
  // State for hover effects
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Navigation structure
  const navStructure = createNavStructure();
  
  // Helper function to determine if a nav item should be highlighted
  // based on current route (supports child routes)
  const isNavItemActive = (itemValue: string): boolean => {
    if (activeSection === itemValue) return true;
    
    // Special handling for parent pages with child routes
    // Remove hearings from cases - now standalone
    if (itemValue === 'documents' && ['efile', 'service-logs'].includes(activeSection)) {
      return true;
    }
    
    return false;
  };


  // Render a navigation item with enhanced styling and interactions
  const renderNavItem = (item: NavItem) => {
    const isActive = isNavItemActive(item.value);
    const isItemHovered = hoveredItem === item.value;
    const showExpanded = !isCollapsed || isHovering;
    
    return (
      <div key={item.value} className="relative">
        <div
          onClick={() => onSectionChange(item.value)}
          onMouseEnter={() => setHoveredItem(item.value)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            group relative flex items-center w-full text-sm font-medium rounded-lg 
            transition-all duration-200 ease-in-out text-left cursor-pointer
            min-h-[3rem] transform-gpu
            ${showExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center'}
            ${isActive 
              ? 'bg-gradient-to-r from-primary-50 to-primary-50/50 text-primary-700 shadow-sm border border-primary-100/50' 
              : 'text-neutral-700 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-white hover:shadow-sm'}
            ${isItemHovered && !isActive ? 'translate-x-1 hover:border-neutral-200/50 hover:border' : ''}
          `}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSectionChange(item.value);
            }
          }}
          title={(!showExpanded && !isHovering) ? `${item.label}${item.description ? ` - ${item.description}` : ''}` : undefined}
        >
          {/* Icon with enhanced styling */}
          <span className={`
            ${showExpanded ? 'mr-3' : ''} 
            transition-all duration-200 ease-in-out transform-gpu
            ${isActive 
              ? 'text-primary-600 scale-110' 
              : 'text-neutral-500 group-hover:text-neutral-700 group-hover:scale-105'}
          `} aria-hidden="true">
            {item.icon}
          </span>
          
          {showExpanded && (
            <>
              <span className="flex-1 truncate text-left font-medium">{item.label}</span>
              
              {item.count !== undefined && (
                <span className={`
                  ml-auto py-1 px-2.5 rounded-full text-xs font-medium
                  transition-all duration-200 ease-in-out
                  ${isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'}
                `}>
                  {item.count}
                </span>
              )}
              
              {item.shortcut && (
                <span className="ml-auto text-neutral-400 text-xs font-mono">
                  {item.shortcut}
                </span>
              )}
            </>
          )}
          
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-600 rounded-r-full" />
          )}
        </div>
        
        {/* Tooltip for collapsed state (only show when not hovering sidebar) */}
        {isCollapsed && !isHovering && isItemHovered && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-xs text-neutral-300 mt-1">{item.description}</div>
            )}
            {/* Tooltip arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
          </div>
        )}
      </div>
    );
  };

  // Favorites section has been removed

  // Recent section has been removed

  // Render the main navigation with enhanced spacing
  const renderMainNav = () => {
    return (
      <div className="space-y-4">
        {!isCollapsed && (
          <div className="px-4 py-2 text-left">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Navigation
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          {navStructure.map(item => renderNavItem(item))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-20 
        bg-white/95 backdrop-blur-sm
        border-r-2 border-neutral-200/60 shadow-lg rounded-r-xl
        bg-gradient-to-b from-white to-neutral-50/50
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${isCollapsed ? (isHovering ? 'w-72' : 'w-20') : 'w-64'}
        group
      `}
      style={{ contain: 'layout style paint' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Sidebar header with logo and enhanced styling */}
      <div className="h-16 flex items-center justify-center px-6 border-b border-neutral-200/50 bg-gradient-to-r from-white/80 to-neutral-50/80">
        <img 
          src="/wszmainlogo.webp" 
          alt={(!isCollapsed || isHovering) ? "WSZLLP - Law Firm Management System" : "WSZLLP"}
          className={`w-auto object-contain transition-all duration-300 ease-in-out ${
            (!isCollapsed || isHovering) 
              ? "h-12 max-w-[240px]" 
              : "h-10 max-w-[56px]"
          }`}
          loading="eager"
        />
      </div>
      
      {/* Sidebar content with enhanced spacing and scrollbar styling */}
      <div className={`
        overflow-y-auto h-[calc(100vh-4rem)] sidebar-scrollbar
        ${(!isCollapsed || isHovering) ? 'p-6' : 'p-3'}
        transition-all duration-300 ease-in-out
      `}>
        {/* Navigation with enhanced spacing */}
        <nav className="space-y-4">
          {renderMainNav()}
        </nav>
        
        {/* Enhanced help section */}
        <div className="mt-8 pt-6 border-t border-neutral-200/60">
          {(!isCollapsed || isHovering) ? (
              <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-primary-50/50 rounded-xl border border-primary-100/50 shadow-sm text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <HelpCircle size={16} className="text-primary-600" />
                  <h3 className="text-sm font-semibold text-primary-800">Need Help?</h3>
                </div>
                <p className="text-xs text-primary-600 mb-3 leading-relaxed">
                  Contact support for assistance with your legal case management system.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center text-xs font-medium text-primary-700 hover:text-primary-800 hover:underline transition-colors duration-200"
                >
                  Contact Support →
                </a>
              </div>
          ) : (
            <div className="relative group">
              <div 
                role="button" 
                tabIndex={0}
                className={`
                  w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-50/50 
                  border border-primary-100/50 shadow-sm
                  flex items-center justify-center text-primary-600 cursor-pointer
                  transition-all duration-200 ease-in-out
                  hover:shadow-md hover:scale-105 hover:bg-primary-100
                `}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;