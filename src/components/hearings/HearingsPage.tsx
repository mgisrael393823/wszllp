import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../ui';
import HearingList from './HearingList';

const HearingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="page-container">
      <PageHeader 
        title="Hearings"
        subtitle="Manage court hearings and proceedings"
        primaryAction={{
          label: "New Hearing",
          onClick: () => navigate('/hearings/new'),
          icon: <Plus size={16} />
        }}
      />
      
      <HearingList />
    </div>
  );
};

export default HearingsPage;