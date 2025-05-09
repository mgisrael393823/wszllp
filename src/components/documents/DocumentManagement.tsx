import React from 'react';
import { useNavigate } from 'react-router-dom';
import { File, Upload, FolderOpen, Search } from 'lucide-react';
import DocumentList from './DocumentList';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * Document Management component
 * Central hub for all document-related features
 */
const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500">Manage legal documents, filings, and service attempts</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<Search size={16} />}
            onClick={() => navigate('/documents/list')}
          >
            View All
          </Button>
          <Button
            variant="primary"
            icon={<Upload size={16} />}
            onClick={() => navigate('/documents/new')}
          >
            Upload
          </Button>
        </div>
      </div>
      
      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Complaint')}>
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <File className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">Complaints</h3>
              <p className="text-sm text-gray-500">Case filings and complaints</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Summons')}>
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <File className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">Summons</h3>
              <p className="text-sm text-gray-500">Summons and notices</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Other')}>
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">Other Documents</h3>
              <p className="text-sm text-gray-500">Motions, orders, and other filings</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Documents */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
        <DocumentList limit={5} />
      </div>
    </div>
  );
};

export default DocumentManagement;