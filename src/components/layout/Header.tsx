import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, Search, User, HelpCircle, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Typography from '../ui/Typography';
import NotificationBell from '../notifications/NotificationBell';
import { useAuth } from '../../context/AuthContext';

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

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className={`
      bg-white border-b border-neutral-200 sticky top-0 z-20
      transition-shadow duration-200
      ${isScrolled ? 'shadow-md' : ''}
    `}>
      <div className="px-content-normal sm:px-content-comfortable lg:px-content-spacious">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Menu toggle, sidebar collapse toggle */}
          <div className="flex items-center">
            <Button 
              variant="text" 
              onClick={toggleSidebar}
              className="md:hidden -ml-1 mr-2"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <Button
              variant="text"
              onClick={toggleSidebarCollapse}
              className="hidden md:flex"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </div>


          {/* Right section: Search, notifications, user menu */}
          <div className="flex items-center space-x-1 sm:space-x-content-tight">
            {/* Search button (mobile) - expand to search bar on larger screens */}
            <div className="hidden sm:flex relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-neutral-400" />
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
              <Search className="w-5 h-5" />
            </Button>

            {/* Help button */}
            <Button
              variant="text"
              size="sm"
              className="hidden sm:flex"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
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
                <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  <Typography variant="caption" weight="medium">{getUserInitials()}</Typography>
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
                      className="flex items-center px-content-normal py-2 hover:bg-neutral-100"
                      role="menuitem"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <Typography variant="caption" color="default">Profile</Typography>
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-content-normal py-2 hover:bg-neutral-100"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      <Typography variant="caption" color="default">Settings</Typography>
                    </Link>
                    <hr className="my-1 border-neutral-200" />
                    <button 
                      onClick={() => signOut()}
                      className="flex items-center w-full text-left px-content-normal py-2 hover:bg-neutral-100"
                      role="menuitem"
                    >
                      <Typography variant="caption" color="default">Sign out</Typography>
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