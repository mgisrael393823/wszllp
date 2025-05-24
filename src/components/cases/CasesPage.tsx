import React from 'react';
import { useData } from '../../context/DataContext';
import { Outlet } from 'react-router-dom';
import TabBar, { TabItem } from '../ui/TabBar';
import { Briefcase, Plus, Clock } from 'lucide-react';

const CasesPage: React.FC = () => {
  const { state } = useData();

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
    },
    {
      label: 'Hearings',
      value: 'hearings',
      route: '/cases/hearings',
      icon: <Clock size={16} />,
      count: state.hearings.length
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="text-neutral-600 mt-1">Manage your legal cases and proceedings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabBar tabs={tabs} className="tab-bar sticky top-0 bg-white z-10" />

      {/* Tab Content */}
      <div className="min-h-96">
        <Outlet />
      </div>
    </div>
  );
};

export default CasesPage;