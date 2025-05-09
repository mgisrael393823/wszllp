import React from 'react';
import { 
  Briefcase, FileClock, FileText, Truck, CreditCard, 
  Calendar, Users, Video, Activity, ChevronDown, Upload
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  count?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  activeSection, 
  onSectionChange 
}) => {
  const navItems: NavItem[] = [
    { label: 'Dashboard', value: 'dashboard', icon: <Activity size={20} /> },
    { label: 'Cases', value: 'cases', icon: <Briefcase size={20} /> },
    { label: 'Hearings', value: 'hearings', icon: <Calendar size={20} /> },
    { label: 'Documents', value: 'documents', icon: <FileText size={20} /> },
    { label: 'eFiling', value: 'efile', icon: <Upload size={20} /> },
    { label: 'Service Logs', value: 'service-logs', icon: <Truck size={20} /> },
    { label: 'Invoices', value: 'invoices', icon: <CreditCard size={20} /> },
    { label: 'Payment Plans', value: 'payment-plans', icon: <FileClock size={20} /> },
    { label: 'Contacts', value: 'contacts', icon: <Users size={20} /> },
    { label: 'Zoom Links', value: 'zoom-links', icon: <Video size={20} /> },
  ];

  const [openPanel, setOpenPanel] = React.useState('cases');

  // Group the navigation items
  const navGroups = {
    main: ['dashboard', 'cases', 'hearings'],
    documents: ['documents', 'efile', 'service-logs'],
    billing: ['invoices', 'payment-plans'],
    contacts: ['contacts', 'zoom-links'],
  };

  const togglePanel = (panel: string) => {
    setOpenPanel(openPanel === panel ? '' : panel);
  };

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Navigation</h2>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4">
        <nav className="space-y-1">
          {/* Main Items */}
          <div className="mb-4">
            {navItems
              .filter(item => navGroups.main.includes(item.value))
              .map(item => (
                <button
                  key={item.value}
                  onClick={() => onSectionChange(item.value)}
                  className={`
                    flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeSection === item.value 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <span className="mr-3 text-gray-500">{item.icon}</span>
                  {item.label}
                  {item.count && (
                    <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {item.count}
                    </span>
                  )}
                </button>
              ))
            }
          </div>

          {/* Documents Group */}
          <div className="mb-4">
            <button
              onClick={() => togglePanel('documents')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <span className="font-semibold">Documents</span>
              <ChevronDown 
                size={16} 
                className={`transform transition-transform ${openPanel === 'documents' ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {openPanel === 'documents' && (
              <div className="pl-6 mt-1 space-y-1">
                {navItems
                  .filter(item => navGroups.documents.includes(item.value))
                  .map(item => (
                    <button
                      key={item.value}
                      onClick={() => onSectionChange(item.value)}
                      className={`
                        flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${activeSection === item.value 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      <span className="mr-3 text-gray-500">{item.icon}</span>
                      {item.label}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Billing Group */}
          <div className="mb-4">
            <button
              onClick={() => togglePanel('billing')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <span className="font-semibold">Billing</span>
              <ChevronDown 
                size={16}
                className={`transform transition-transform ${openPanel === 'billing' ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {openPanel === 'billing' && (
              <div className="pl-6 mt-1 space-y-1">
                {navItems
                  .filter(item => navGroups.billing.includes(item.value))
                  .map(item => (
                    <button
                      key={item.value}
                      onClick={() => onSectionChange(item.value)}
                      className={`
                        flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${activeSection === item.value 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      <span className="mr-3 text-gray-500">{item.icon}</span>
                      {item.label}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Contacts Group */}
          <div className="mb-4">
            <button
              onClick={() => togglePanel('contacts')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <span className="font-semibold">Contacts</span>
              <ChevronDown 
                size={16}
                className={`transform transition-transform ${openPanel === 'contacts' ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {openPanel === 'contacts' && (
              <div className="pl-6 mt-1 space-y-1">
                {navItems
                  .filter(item => navGroups.contacts.includes(item.value))
                  .map(item => (
                    <button
                      key={item.value}
                      onClick={() => onSectionChange(item.value)}
                      className={`
                        flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${activeSection === item.value 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      <span className="mr-3 text-gray-500">{item.icon}</span>
                      {item.label}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="px-3 py-4 bg-primary-50 rounded-lg">
            <h3 className="text-sm font-medium text-primary-800">Need Help?</h3>
            <p className="mt-1 text-xs text-primary-600">
              Contact support for assistance with your legal case management system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;