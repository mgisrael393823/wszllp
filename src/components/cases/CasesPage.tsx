import React from 'react';
import { useData } from '../../context/DataContext';
import { Outlet, useNavigate } from 'react-router-dom';
import TabBar, { TabItem } from '../ui/TabBar';
import Button from '../ui/Button';
import { Briefcase, Plus } from 'lucide-react';

const CasesPage: React.FC = () => {
  const { state } = useData();
  const navigate = useNavigate();

  // Define tabs for the Cases section
  const tabs: TabItem[] = [
    {
      label: 'List Cases',
      value: 'list',
      route: '/cases',
      icon: <Briefcase size={16} />,
      count: state.cases.length
    },
    {
      label: 'New Case',
      value: 'new',
      route: '/cases/new',
      icon: <Plus size={16} />
    }
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Manage your legal cases and proceedings</p>
        </div>
        <div className="page-actions">
          <Button onClick={() => navigate('/cases/new')} icon={<Plus size={16} />}>
            New Case
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 backdrop-blur-sm pb-2 -mx-6 px-6">
        <TabBar tabs={tabs} />
      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
};

export default CasesPage;