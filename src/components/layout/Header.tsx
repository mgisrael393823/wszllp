import React from 'react';
import { Menu, Bell } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1 flex items-center">
            <Button 
              variant="text" 
              onClick={toggleSidebar}
              className="md:hidden -ml-1 mr-2"
              aria-label="Toggle navigation menu"
            >
              <Menu size={24} />
            </Button>
          </div>
          <div className="flex-shrink-0 flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src="/mainlogo.png" alt="Logo" className="h-12 w-auto" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center">
              <Button 
                variant="text" 
                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </Button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <Button 
                    variant="text"
                    className="flex text-sm rounded-full focus:outline-none"
                    aria-label="User menu"
                  >
                    <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      CZ
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;