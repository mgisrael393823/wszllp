import React from 'react';
import { EFileProvider } from '@/context/EFileContext';
import EFileSubmissionForm from './EFileSubmissionForm';
import EFileStatusList from './EFileStatusList';

const EFilePage: React.FC = () => (
  <EFileProvider>
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-center text-gray-800">Batch eFiling</h1>
          <a
            href="https://api.wszllp.com/docs/efile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-800 mt-2"
          >
            View eFile API Docs
          </a>
        </div>
        <EFileSubmissionForm />
        <EFileStatusList />
      </div>
    </div>
  </EFileProvider>
);

export default EFilePage;
