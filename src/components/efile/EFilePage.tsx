import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EFileProvider } from '@/context/EFileContext';
import EFileSubmissionForm from './EFileSubmissionForm';
import EFileStatusList from './EFileStatusList';

// Create with v5 API format
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { 
      refetchOnWindowFocus: false 
    },
    mutations: {
      // Add default mutation options if needed
    }
  },
});

// Add debug logging
console.log("EFilePage: Environment variables check:", {
  hasBaseUrl: !!import.meta.env.VITE_EFILE_BASE_URL,
  hasClientToken: !!import.meta.env.VITE_EFILE_CLIENT_TOKEN,
  hasUsername: !!import.meta.env.VITE_EFILE_USERNAME,
  hasPassword: !!import.meta.env.VITE_EFILE_PASSWORD,
  reactQueryVersion: '@tanstack/react-query version: 5.x'
});

const EFilePage: React.FC = () => {
  // console.log('🔥 EFilePage mounted, env flags:', import.meta.env);
  // return <h1 data-testid="efile-page-test">E-Filing Page Loaded</h1>;

  return (
    <QueryClientProvider client={queryClient}>
      <EFileProvider>
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Batch eFiling</h1>
              <a
                href="https://api.wszllp.com/docs/efile"
                target="_blank"
                rel="noopener noreferrer"
                className="page-subtitle text-primary-600 hover:text-primary-800"
              >
                View eFile API Docs
              </a>
            </div>
          </div>
          <div className="max-w-3xl mx-auto">
            <EFileSubmissionForm />
            <EFileStatusList />
          </div>
        </div>
      </EFileProvider>
    </QueryClientProvider>
  );
};

export default EFilePage;
