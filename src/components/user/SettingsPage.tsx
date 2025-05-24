import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Lock, Bell, Shield, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Settings sections with their corresponding icons and actions
  const settingsSections = [
    {
      title: 'Account Settings',
      icon: <Settings size={20} />,
      description: 'Manage your account settings and preferences',
      action: () => navigate('/profile'),
    },
    {
      title: 'Security',
      icon: <Lock size={20} />,
      description: 'Update your password and security settings',
      action: () => {}, // Implement in the future
    },
    {
      title: 'Notifications',
      icon: <Bell size={20} />,
      description: 'Configure notification preferences',
      action: () => navigate('/notifications'),
    },
    {
      title: 'Privacy',
      icon: <Shield size={20} />,
      description: 'Review and manage privacy settings',
      action: () => {}, // Implement in the future
    },
    {
      title: 'Appearance',
      icon: <Moon size={20} />,
      description: 'Customize the appearance of your workspace',
      action: () => {}, // Implement in the future
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>
      
      <div className="grid gap-6 max-w-3xl mx-auto">
        {settingsSections.map((section) => (
          <Card key={section.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <button
              onClick={section.action}
              className="w-full text-left p-6 flex items-start"
            >
              <div className="flex-shrink-0 mr-4 text-primary-600">
                {section.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium">{section.title}</h3>
                <p className="text-neutral-600 mt-1">{section.description}</p>
              </div>
            </button>
          </Card>
        ))}
        
        <Card className="bg-neutral-50 border-neutral-200">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4 text-error-600">
                <LogOut size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-medium">Sign Out</h3>
                <p className="text-neutral-600 mt-1">
                  Sign out of your account on this device
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  variant="danger"
                  onClick={handleSignOut}
                  loading={isLoading}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;