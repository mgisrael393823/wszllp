import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EFileProvider } from '@/context/EFileContext';
import EFileSubmissionForm from './EFileSubmissionForm';
import EFileStatusList from './EFileStatusList';
import PageCard from '@/components/ui/PageCard';

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

  const documentationButton = (
    <a
      href="https://api.wszllp.com/docs/efile"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg font-medium transition-colors border border-blue-200 text-sm"
      aria-label="View E-Filing API Documentation in a new tab"
    >
      View API Docs →
    </a>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EFileProvider>
        <div data-cy="efile-page" className="space-y-6">
          {/* Main E-Filing Card */}
          <PageCard
            data-cy="efile-form"
            title="WSZ Direct E-Filing Integration"
            subtitle="Submit legal documents directly to the court through Tyler Technologies API"
            primaryAction={documentationButton}
            maxWidth="4xl"
          >
            <EFileSubmissionForm />
          </PageCard>

          {/* Status List Card */}
          <PageCard
            data-cy="efile-status"
            title="Filing Status"
            subtitle="Track the status of your submitted e-filings"
            maxWidth="4xl"
            withBackground={false}
          >
            <EFileStatusList />
          </PageCard>
        </div>
      </EFileProvider>
    </QueryClientProvider>
  );
};

export default EFilePage;
