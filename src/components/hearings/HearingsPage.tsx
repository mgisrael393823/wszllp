import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, History } from 'lucide-react';
import { PageHeader, TabBar } from '../ui';
import HearingList from './HearingList';
import type { TabItem } from '../ui/TabBar';

const HearingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'upcoming';

  const tabs: TabItem[] = [
    {
      label: 'Upcoming',
      value: 'upcoming',
      route: '/hearings?tab=upcoming',
      icon: <Calendar size={16} />
    },
    {
      label: 'Past',
      value: 'past', 
      route: '/hearings?tab=past',
      icon: <History size={16} />
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hearings</h1>
          <p className="page-subtitle">
            Manage court hearings and proceedings
          </p>
        </div>
        <button 
          onClick={() => navigate('/hearings/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          New Hearing
        </button>
      </div>
      
      <div className="sticky top-0 z-10 backdrop-blur-sm pb-2 -mx-6 px-6">
        <TabBar tabs={tabs} />
      </div>
      
      <HearingList temporalFilter={currentTab as 'upcoming' | 'past'} />
    </div>
  );
};

export default HearingsPage;