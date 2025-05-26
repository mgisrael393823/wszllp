import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Calendar, FileText, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/**
 * NotificationsPage component with planned notification settings
 * Shows the vision for notification features in future updates
 */
const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    caseUpdates: true,
    hearingReminders: true,
    documentAlerts: true,
    systemNotifications: false,
  });

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const notificationTypes = [
    {
      icon: <FileText size={20} />,
      title: 'Case Updates',
      description: 'Get notified when case status changes or new documents are added',
      setting: 'caseUpdates' as keyof typeof settings,
    },
    {
      icon: <Calendar size={20} />,
      title: 'Hearing Reminders',
      description: 'Receive reminders before scheduled hearings and deadlines',
      setting: 'hearingReminders' as keyof typeof settings,
    },
    {
      icon: <Bell size={20} />,
      title: 'Document Alerts',
      description: 'Notifications for document service status and deadlines',
      setting: 'documentAlerts' as keyof typeof settings,
    },
    {
      icon: <Users size={20} />,
      title: 'System Updates',
      description: 'Information about system maintenance and new features',
      setting: 'systemNotifications' as keyof typeof settings,
    },
  ];

  const deliveryMethods = [
    {
      icon: <Mail size={20} />,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      setting: 'emailNotifications' as keyof typeof settings,
    },
    {
      icon: <MessageSquare size={20} />,
      title: 'Push Notifications',
      description: 'Browser push notifications for immediate alerts',
      setting: 'pushNotifications' as keyof typeof settings,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Settings
          </Button>
        </div>
        <h1 className="page-title">Notification Settings</h1>
        <p className="page-subtitle">
          Configure how and when you receive notifications about your legal cases.
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Delivery Methods */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Methods</h2>
            <div className="space-y-4">
              {deliveryMethods.map((method) => (
                <div key={method.title} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-primary-600 mt-1">
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{method.title}</h3>
                      <p className="text-neutral-600 text-sm">{method.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[method.setting]}
                      onChange={() => handleToggle(method.setting)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Notification Types */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Types</h2>
            <div className="space-y-4">
              {notificationTypes.map((type) => (
                <div key={type.title} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-primary-600 mt-1">
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{type.title}</h3>
                      <p className="text-neutral-600 text-sm">{type.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[type.setting]}
                      onChange={() => handleToggle(type.setting)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-primary-200 bg-primary-50">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <Bell className="text-primary-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-medium text-primary-900">Enhanced Notifications Coming Soon</h3>
                <p className="text-primary-700 mt-1">
                  Advanced notification features including real-time alerts, custom notification rules, 
                  and integration with external calendar systems will be available in upcoming releases.
                </p>
                <div className="mt-4">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/settings')}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;