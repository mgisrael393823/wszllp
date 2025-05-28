import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, Search, User, HelpCircle, Settings } from 'lucide-react';
import Button from '../ui/Button';
import NotificationBell from '../notifications/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useSandboxMode } from '../../hooks/useSandboxMode';

interface HeaderProps {
  toggleSidebar: () => void;
  toggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  isScrolled?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  toggleSidebar, 
  toggleSidebarCollapse,
  isSidebarCollapsed = false,
  isScrolled = false
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isSandbox, isLoading } = useSandboxMode();

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Professional demo indicator component
  const DemoIndicator = () => {
    if (isLoading || !isSandbox) return null;
    
    return (
      <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm mr-3">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold">DEMO</span>
        <span className="text-blue-100 text-xs hidden lg:inline">|</span>
        <span className="text-blue-100 text-xs hidden lg:inline">Sample Data</span>
      </div>
    );
  };

  return (
    <header className={`
      bg-white border-b border-neutral-200 sticky top-0 z-20
      transition-shadow duration-200
      ${isScrolled ? 'shadow-md' : ''}
    `}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Menu toggle, sidebar collapse toggle */}
          <div className="flex items-center">
            <Button 
              variant="text" 
              onClick={toggleSidebar}
              className="md:hidden -ml-1 mr-2"
              aria-label="Toggle navigation menu"
            >
              <Menu size={24} />
            </Button>
            <Button
              variant="text"
              onClick={toggleSidebarCollapse}
              className="hidden md:flex"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </Button>
          </div>

          {/* Right section: Demo indicator, Search, notifications, user menu */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <DemoIndicator />
            {/* Search button (mobile) - expand to search bar on larger screens */}
            <div className="hidden sm:flex relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-neutral-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-1.5 block w-full rounded-md border border-neutral-200 
                           focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
              />
            </div>
            <Button 
              variant="text" 
              size="sm" 
              className="sm:hidden"
              aria-label="Search"
            >
              <Search size={20} />
            </Button>

            {/* Help button */}
            <Button
              variant="text"
              size="sm"
              className="hidden sm:flex"
              aria-label="Help"
            >
              <HelpCircle size={20} />
            </Button>

            {/* Notifications */}
            <NotificationBell className="p-1 rounded-full text-neutral-500 hover:text-neutral-700" />
            
            {/* User menu */}
            <div className="relative">
              <Button 
                variant="text"
                className="flex items-center space-x-1 rounded-full focus:outline-none"
                onClick={toggleUserMenu}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                  {getUserInitials()}
                </span>
              </Button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-30"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="py-1">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      role="menuitem"
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      role="menuitem"
                    >
                      <Settings size={16} className="mr-2" />
                      Settings
                    </Link>
                    <hr className="my-1 border-neutral-200" />
                    <button 
                      onClick={() => signOut()}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;