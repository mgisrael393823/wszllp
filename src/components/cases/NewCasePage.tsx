import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseForm from './CaseForm';

const NewCasePage: React.FC = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(true);

  const handleClose = () => {
    setIsFormOpen(false);
    navigate('/cases');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <CaseForm
        isOpen={isFormOpen}
        onClose={handleClose}
        caseId={null}
      />
    </div>
  );
};

export default NewCasePage;