import React, { useState } from 'react';
import Card from '../ui/Card';
import DataImportTool from './DataImportTool';
import SimpleImportTool from './SimpleImportTool';
import { Database, Settings, Shield, Users, Upload, RefreshCw } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'import' | 'enhanced-import' | 'settings' | 'users' | 'security'>('enhanced-import');

  const tabs = [
    { id: 'import', label: 'Legacy Import', icon: <Database className="w-5 h-5" /> },
    { id: 'enhanced-import', label: 'Enhanced Import', icon: <Upload className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-gray-600">System administration and data management</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="sm:hidden">
          <select
            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'import' && <DataImportTool />}
          
          {activeTab === 'enhanced-import' && <SimpleImportTool />}
          
          {activeTab === 'settings' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">System Settings</h2>
              <p className="text-gray-500">Settings will be available in a future update.</p>
            </Card>
          )}
          
          {activeTab === 'users' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">User Management</h2>
              <p className="text-gray-500">User management will be available in a future update.</p>
            </Card>
          )}
          
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <p className="text-gray-500">Security settings will be available in a future update.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;