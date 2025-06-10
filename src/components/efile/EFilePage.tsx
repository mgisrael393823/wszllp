import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EFileProvider } from '../../context/EFileContext';
import EFileSubmissionForm from './EFileSubmissionForm';
import EFileStatusListSimple from './EFileStatusListSimple';
import EFileDrafts from './EFileDrafts';
import PageCard from '../ui/PageCard';

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
// console.log('EFilePage: Environment variables check:', {
//   hasBaseUrl: !!import.meta.env.VITE_EFILE_BASE_URL,
//   hasClientToken: !!import.meta.env.VITE_EFILE_CLIENT_TOKEN,
//   hasUsername: !!import.meta.env.VITE_EFILE_USERNAME,
//   hasPassword: !!import.meta.env.VITE_EFILE_PASSWORD,
//   reactQueryVersion: '@tanstack/react-query version: 5.x'
// });

const EFilePage: React.FC = () => {
  const [formKey, setFormKey] = useState(0); // To force form re-render when loading draft

  const handleLoadDraft = (draftData: any) => {
    // Force form to re-render with new key
    setFormKey(prev => prev + 1);
    
    // The form will load the draft data from localStorage on mount
    const existingDrafts = JSON.parse(localStorage.getItem('efileDrafts') || '[]');
    // Add the loaded draft as the most recent
    localStorage.setItem('efileDraftsToLoad', JSON.stringify(draftData));
  };

  const healthCheckButton = (
    <a
      href="/api/health-check.html"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 rounded-lg font-medium transition-colors border border-green-200 text-sm"
      aria-label="Check E-Filing Health Status in a new tab"
    >
      Check E-filing Health Status
    </a>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EFileProvider>
        <div data-cy="efile-page" className="space-y-6">
          {/* Saved Drafts Card */}
          <PageCard
            data-cy="efile-drafts"
            title="Saved Drafts"
            subtitle="Load a previously saved e-filing draft"
            maxWidth="4xl"
            withBackground={false}
          >
            <EFileDrafts onLoadDraft={handleLoadDraft} />
          </PageCard>

          {/* Main E-Filing Card */}
          <PageCard
            data-cy="efile-form"
            title="WSZ Direct E-Filing Integration"
            subtitle="Submit legal documents directly to the court through Tyler Technologies API"
            primaryAction={healthCheckButton}
            maxWidth="4xl"
          >
            <EFileSubmissionForm key={formKey} />
          </PageCard>

          {/* Status List Card */}
          <PageCard
            data-cy="efile-status"
            title="Filing Status"
            subtitle="Track the status of your submitted e-filings"
            maxWidth="4xl"
            withBackground={false}
          >
            <EFileStatusListSimple />
          </PageCard>
        </div>
      </EFileProvider>
    </QueryClientProvider>
  );
};

export default EFilePage;
