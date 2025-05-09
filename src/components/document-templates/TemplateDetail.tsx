import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <Button
        variant="text"
        onClick={() => navigate('/templates')}
        icon={<ArrowLeft size={16} />}
        className="mb-4"
      >
        Back to Templates
      </Button>
      
      <h1 className="text-2xl font-bold text-gray-900">Template Detail</h1>
      <p className="text-gray-500 mt-1">Template ID: {id}</p>
      <p className="text-gray-500 mt-4">This feature is coming soon</p>
    </div>
  );
};

export default TemplateDetail;