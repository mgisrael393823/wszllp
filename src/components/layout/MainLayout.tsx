import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  /**
   * Page template type to apply different layouts
   * - default: Standard layout with sidebar
   * - fullWidth: No max-width constraint on content
   * - narrow: Narrower content area for focused tasks
   */
  template?: 'default' | 'fullWidth' | 'narrow';
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeSection,
  onSectionChange,
  template = 'default'
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle sidebar toggle for mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle sidebar collapse toggle for desktop
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Close sidebar when clicking outside on mobile
  const handleContentClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine content width based on template
  const getContentClass = () => {
    switch (template) {
      case 'fullWidth':
        return 'container-full';
      case 'narrow':
        return 'container-narrow';
      default:
        return 'container-custom';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header 
        toggleSidebar={toggleSidebar} 
        toggleSidebarCollapse={toggleSidebarCollapse}
        isSidebarCollapsed={isSidebarCollapsed}
        isScrolled={isScrolled}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          isCollapsed={isSidebarCollapsed}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
        
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={handleContentClick}
            aria-hidden="true"
          />
        )}
        
        <main 
          className={`
            flex-1 overflow-y-auto 
            ml-0 md:ml-64 md:transition-all md:duration-300 
            ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
          `}
          onClick={handleContentClick}
        >
          <div className={`py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 ${getContentClass()}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;