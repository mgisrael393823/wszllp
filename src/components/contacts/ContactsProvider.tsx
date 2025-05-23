import React from 'react';
import { Refine } from '@refinedev/core';
import { useNavigate, useLocation } from 'react-router-dom';
import routerProvider from '@refinedev/react-router-v6';
import { createSupabaseDataProvider } from '../../utils/refine/supabaseDataProvider';

/**
 * Provider component that wraps the Contacts module with Refine
 * This allows us to use Refine's hooks and capabilities just for contacts
 * without affecting the rest of the application
 */
export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Create a data provider that uses Supabase
  const dataProvider = createSupabaseDataProvider();

  return (
    <Refine
      // Use our Supabase-based data provider
      dataProvider={dataProvider}
      
      // Set up routing for Refine to use React Router v6
      routerProvider={routerProvider}
      
      // Configure resources (just contacts for now)
      resources={[
        {
          name: "contacts",
          list: "/contacts",
          create: "/contacts/new",
          edit: "/contacts/:id/edit",
          show: "/contacts/:id",
          meta: {
            canDelete: true,
          },
        },
      ]}
      
      // Configure options
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        useNewQueryKeys: true,
        projectId: "wszllp-contacts",
      }}
    >
      {children}
    </Refine>
  );
};