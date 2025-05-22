import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import HearingForm from './HearingForm';
import HearingList from './HearingList';
import Card from '../ui/Card';

const HearingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isFormOpen, setIsFormOpen] = useState(!!id || id === 'new');
  
  const closeForm = () => {
    setIsFormOpen(false);
    navigate('/hearings');
  };
  
  // If we're on the hearings/new route, render the form
  if (window.location.pathname === '/hearings/new') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Add New Hearing</h1>
        <HearingForm 
          isOpen={true}
          onClose={() => navigate('/hearings')}
          hearingId={null}
          standalone={true}
        />
      </div>
    );
  }
  
  // If we're on a specific hearing route, render the form for that hearing
  if (id && id !== 'new') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Edit Hearing</h1>
        <HearingForm 
          isOpen={true}
          onClose={() => navigate('/hearings')}
          hearingId={id}
          standalone={true}
        />
      </div>
    );
  }
  
  // Otherwise, render the hearings list
  return <HearingList />;
};

export default HearingsPage;