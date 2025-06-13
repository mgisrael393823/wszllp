# Fix Data Import Issue - Complete Implementation Guide

## Problem Summary

The data import functionality appears to work (shows success message with counts) but imported data doesn't appear in the respective tabs. There are two root causes:

1. **Action Type Mismatch**: The EnhancedDataImporter dispatches bulk actions (`ADD_CASES`, `ADD_HEARINGS`, etc.) but the DataContext reducer only handles singular actions (`ADD_CASE`, `ADD_HEARING`, etc.)

2. **Data Source Inconsistency**: Some components fetch data from Supabase directly instead of the DataContext, causing imported data (stored in local state) to not appear.

## Affected Components

### Components Using DataContext (Working Correctly)
- CasesPage and CasesList
- InvoiceList

### Components Using Supabase (Not Showing Imported Data)
- ContactsPage (via ContactsProvider with Refine/Supabase)
- DocumentList (via useDocuments hook)
- HearingList (fetches from Supabase)

## Implementation Steps

### Step 1: Add Bulk Action Handlers to DataContext

**File**: `/Users/michaelisrael/wszllp/src/context/DataContext.tsx`

Add these new action types to the `Action` type union (around line 35):

```typescript
| { type: 'ADD_CASES'; payload: Case[] }
| { type: 'ADD_HEARINGS'; payload: Hearing[] }
| { type: 'ADD_DOCUMENTS'; payload: Document[] }
| { type: 'ADD_INVOICES'; payload: Invoice[] }
| { type: 'ADD_CONTACTS'; payload: Contact[] }
```

Add these case handlers to the reducer function (after the existing singular action handlers):

```typescript
// Bulk Case actions
case 'ADD_CASES':
  const newCases = action.payload.map(caseItem => ({
    ...caseItem,
    createdAt: caseItem.createdAt || now,
    updatedAt: caseItem.updatedAt || now
  }));
  
  newState = {
    ...state,
    cases: [...state.cases, ...newCases],
  };
  
  auditLog = createAuditLog('Case', 'bulk', 'Create', 
    `Bulk import: ${newCases.length} cases added`);
  break;

// Bulk Hearing actions  
case 'ADD_HEARINGS':
  const newHearings = action.payload.map(hearing => ({
    ...hearing,
    createdAt: hearing.createdAt || now,
    updatedAt: hearing.updatedAt || now
  }));
  
  newState = {
    ...state,
    hearings: [...state.hearings, ...newHearings],
  };
  
  auditLog = createAuditLog('Hearing', 'bulk', 'Create',
    `Bulk import: ${newHearings.length} hearings added`);
  break;

// Bulk Document actions
case 'ADD_DOCUMENTS':
  const newDocuments = action.payload.map(doc => ({
    ...doc,
    createdAt: doc.createdAt || now,
    updatedAt: doc.updatedAt || now
  }));
  
  newState = {
    ...state,
    documents: [...state.documents, ...newDocuments],
  };
  
  auditLog = createAuditLog('Document', 'bulk', 'Create',
    `Bulk import: ${newDocuments.length} documents added`);
  break;

// Bulk Invoice actions
case 'ADD_INVOICES':
  const newInvoices = action.payload.map(invoice => ({
    ...invoice,
    createdAt: invoice.createdAt || now,
    updatedAt: invoice.updatedAt || now
  }));
  
  newState = {
    ...state,
    invoices: [...state.invoices, ...newInvoices],
  };
  
  auditLog = createAuditLog('Invoice', 'bulk', 'Create',
    `Bulk import: ${newInvoices.length} invoices added`);
  break;

// Bulk Contact actions
case 'ADD_CONTACTS':
  const newContacts = action.payload.map(contact => ({
    ...contact,
    createdAt: contact.createdAt || now,
    updatedAt: contact.updatedAt || now
  }));
  
  newState = {
    ...state,
    contacts: [...state.contacts, ...newContacts],
  };
  
  auditLog = createAuditLog('Contact', 'bulk', 'Create',
    `Bulk import: ${newContacts.length} contacts added`);
  break;
```

### Step 2: Fix Contact List to Use DataContext

**File**: `/Users/michaelisrael/wszllp/src/components/contacts/ContactList.tsx`

Replace the entire file content with a DataContext-based implementation:

```typescript
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { EmptyState } from '../ui';
import { useData } from '../../context/DataContext';
import { Contact } from '../../types/schema';
import { User, Plus } from 'lucide-react';

const ContactList: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useData();
  
  // Get contacts from DataContext
  const contacts = useMemo(() => {
    return state.contacts.map(contact => ({
      ...contact,
      displayName: contact.name,
      displayRole: contact.role || 'Contact',
      displayEmail: contact.email || 'No email',
      displayPhone: contact.phone || 'No phone'
    }));
  }, [state.contacts]);

  // Column definitions
  const columns: ColumnDef<Contact & { displayName: string; displayRole: string; displayEmail: string; displayPhone: string }>[] = [
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-400" />
          <span className="font-medium">{row.original.displayName}</span>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'displayRole',
      header: 'Role',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.displayRole}</span>
      ),
      meta: {
        filterVariant: 'select',
      },
    },
    {
      accessorKey: 'displayEmail',
      header: 'Email',
      cell: ({ row }) => (
        <a 
          href={`mailto:${row.original.email}`} 
          className="text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.displayEmail}
        </a>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'displayPhone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.displayPhone}</span>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.company || '-'}</span>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
  ];

  // Handle empty state
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<User className="w-16 h-16 text-neutral-400" />}
        title="No contacts found"
        description="Add your first contact to start building your network."
        action={{
          label: "Add Contact",
          onClick: () => navigate('/contacts/new'),
          variant: "primary" as const,
          icon: <Plus size={16} />
        }}
      />
    );
  }

  return (
    <DataTable
      data={contacts}
      columns={columns}
      isLoading={false}
      error={null}
      onRowClick={(row) => navigate(`/contacts/${row.contactId}`)}
      enableRowSelection
    />
  );
};

export default ContactList;
```

### Step 3: Create DataContext-Based Document List

**File**: `/Users/michaelisrael/wszllp/src/components/documents/DocumentListLocal.tsx`

Create a new file for local DataContext-based document list:

```typescript
import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Document } from '../../types/schema';

interface DocumentDisplay extends Document {
  caseTitle: string;
  displayType: string;
  displayStatus: string;
  serviceDateFormatted: string;
}

interface DocumentListLocalProps {
  limit?: number;
  caseId?: string;
}

const DocumentListLocal: React.FC<DocumentListLocalProps> = ({ limit, caseId }) => {
  const navigate = useNavigate();
  const { state } = useData();

  // Process documents with case information
  const documents = useMemo(() => {
    let filteredDocs = state.documents;
    
    // Apply case filter if provided
    if (caseId) {
      filteredDocs = filteredDocs.filter(doc => doc.caseId === caseId);
    }
    
    // Apply limit if provided
    if (limit) {
      filteredDocs = filteredDocs.slice(0, limit);
    }

    // Map with case information
    return filteredDocs.map(doc => {
      const caseItem = state.cases.find(c => c.caseId === doc.caseId);
      
      return {
        ...doc,
        caseTitle: caseItem 
          ? `${caseItem.plaintiff} v. ${caseItem.defendant}` 
          : 'Unknown Case',
        displayType: doc.type || 'Document',
        displayStatus: doc.status || 'Pending',
        serviceDateFormatted: doc.serviceDate 
          ? new Date(doc.serviceDate).toLocaleDateString() 
          : 'Not served'
      };
    });
  }, [state.documents, state.cases, caseId, limit]);

  // Column definitions
  const columns: ColumnDef<DocumentDisplay>[] = [
    {
      accessorKey: 'displayType',
      header: 'Document',
      cell: ({ row }) => (
        <div className="flex items-center">
          <FileText size={18} className="text-neutral-400 mr-2" />
          <div>
            <div className="font-medium text-neutral-700">{row.original.displayType}</div>
            <div className="text-neutral-500 text-sm truncate max-w-xs">
              {row.original.fileURL ? (
                <a 
                  href={row.original.fileURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Document
                </a>
              ) : 'No file attached'}
            </div>
          </div>
        </div>
      ),
      meta: { filterVariant: 'select' },
    },
    {
      accessorKey: 'caseTitle',
      header: 'Case',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'displayStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.displayStatus;
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Served': return 'bg-green-100 text-green-800';
            case 'Failed': return 'bg-red-100 text-red-800';
            default: return 'bg-neutral-100 text-neutral-800';
          }
        };
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        );
      },
      meta: { filterVariant: 'select' },
    },
    {
      accessorKey: 'serviceDateFormatted',
      header: 'Service Date',
      meta: { filterVariant: 'text' },
    },
  ];

  // Handle empty state
  if (documents.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <FileText size={64} className="mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No documents found</h3>
        <p className="text-neutral-500">Documents will appear here after import.</p>
      </div>
    );
  }

  return (
    <DataTable
      data={documents}
      columns={columns}
      isLoading={false}
      error={null}
      onRowClick={(row) => navigate(`/documents/${row.docId}`)}
      enableRowSelection
      className={limit ? "border-0 shadow-none" : undefined}
    />
  );
};

export default DocumentListLocal;
```

### Step 4: Create DataContext-Based Hearing List

**File**: `/Users/michaelisrael/wszllp/src/components/hearings/HearingListLocal.tsx`

Create a new file for local DataContext-based hearing list:

```typescript
import React, { useMemo } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { EmptyState } from '../ui';
import { useData } from '../../context/DataContext';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Hearing } from '../../types/schema';

interface HearingDisplay extends Hearing {
  caseTitle: string;
  hearingDateFormatted: string;
  hearingTime: string;
  displayOutcome: string;
  rawDate: Date;
}

interface HearingListLocalProps {
  temporalFilter?: 'upcoming' | 'past';
}

const HearingListLocal: React.FC<HearingListLocalProps> = ({ temporalFilter = 'upcoming' }) => {
  const { state } = useData();
  const navigate = useNavigate();

  // Process hearings with case information and apply temporal filtering
  const hearings = useMemo(() => {
    const now = startOfDay(new Date());
    
    // Map hearings with case data
    const allHearings = state.hearings.map(hearing => {
      const caseItem = state.cases.find(c => c.caseId === hearing.caseId);
      const hearingDateTime = new Date(hearing.hearingDate);
      
      return {
        ...hearing,
        caseTitle: caseItem 
          ? `${caseItem.plaintiff} v. ${caseItem.defendant}` 
          : 'Unknown Case',
        hearingDateFormatted: hearingDateTime.toLocaleDateString(),
        hearingTime: hearingDateTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        displayOutcome: hearing.outcome || 'Pending',
        rawDate: hearingDateTime
      };
    });

    // Apply temporal filtering
    const filtered = allHearings.filter(hearing => {
      const hearingDate = startOfDay(hearing.rawDate);
      
      switch (temporalFilter) {
        case 'upcoming':
          return isAfter(hearingDate, now) || hearingDate.getTime() === now.getTime();
        case 'past':
          return isBefore(hearingDate, now);
        default:
          return true;
      }
    });

    // Sort by date
    return filtered.sort((a, b) => {
      if (temporalFilter === 'upcoming') {
        return a.rawDate.getTime() - b.rawDate.getTime();
      } else {
        return b.rawDate.getTime() - a.rawDate.getTime();
      }
    });
  }, [state.hearings, state.cases, temporalFilter]);

  // Column definitions
  const columns: ColumnDef<HearingDisplay>[] = [
    {
      accessorKey: 'caseTitle',
      header: 'Case',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'courtName',
      header: 'Court',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'hearingDateFormatted',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-neutral-600">
          <Calendar className="w-3 h-3" />
          <span>{row.original.hearingDateFormatted}</span>
        </div>
      ),
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'hearingTime',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.hearingTime}</span>
      ),
    },
    {
      accessorKey: 'displayOutcome',
      header: 'Outcome',
      cell: ({ row }) => {
        const outcome = row.original.displayOutcome;
        const getOutcomeColor = (outcome: string) => {
          switch (outcome.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed':
            case 'judgment': return 'bg-green-100 text-green-800';
            case 'continued': return 'bg-blue-100 text-blue-800';
            case 'dismissed': return 'bg-red-100 text-red-800';
            default: return 'bg-neutral-100 text-neutral-800';
          }
        };
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(outcome)}`}>
            {outcome}
          </span>
        );
      },
      meta: { filterVariant: 'select' },
    },
  ];

  // Handle empty state
  if (hearings.length === 0) {
    const getEmptyStateContent = () => {
      switch (temporalFilter) {
        case 'upcoming':
          return {
            title: "No upcoming hearings",
            description: "You have no hearings scheduled. Schedule a hearing to get started."
          };
        case 'past':
          return {
            title: "No past hearings",
            description: "No completed hearings found. Past hearings will appear here."
          };
        default:
          return {
            title: "No hearings found",
            description: "Add a new hearing to get started."
          };
      }
    };

    const { title, description } = getEmptyStateContent();

    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16 text-neutral-400" />}
        title={title}
        description={description}
        action={temporalFilter === 'upcoming' ? {
          label: "Schedule Hearing",
          onClick: () => navigate('/hearings/new'),
          variant: "primary" as const,
          icon: <Plus size={16} />
        } : undefined}
      />
    );
  }

  return (
    <DataTable
      data={hearings}
      columns={columns}
      isLoading={false}
      error={null}
      onRowClick={(row) => navigate(`/hearings/${row.hearingId}`)}
      enableRowSelection
    />
  );
};

export default HearingListLocal;
```

### Step 5: Add Toggle for Data Source

To maintain backward compatibility while fixing the import issue, add a toggle to switch between local and Supabase data sources.

**File**: `/Users/michaelisrael/wszllp/src/config/dataSourceConfig.ts`

Create a new configuration file:

```typescript
// Configuration for data source selection
// This allows switching between local DataContext and Supabase

export interface DataSourceConfig {
  useLocalDataForContacts: boolean;
  useLocalDataForDocuments: boolean;
  useLocalDataForHearings: boolean;
}

// Default configuration - set to true to use DataContext for imported data
export const dataSourceConfig: DataSourceConfig = {
  useLocalDataForContacts: true,  // Set to true to show imported contacts
  useLocalDataForDocuments: true, // Set to true to show imported documents
  useLocalDataForHearings: true,  // Set to true to show imported hearings
};
```

### Step 6: Update Components to Use Configuration

**File**: `/Users/michaelisrael/wszllp/src/components/contacts/ContactsPage.tsx`

Update to conditionally use local or Supabase data:

```typescript
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ContactsProvider } from './ContactsProvider';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';
import ContactForm from './ContactForm';
import Button from '../ui/Button';
import { dataSourceConfig } from '../../config/dataSourceConfig';

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // If using local data, don't wrap with ContactsProvider
  if (dataSourceConfig.useLocalDataForContacts) {
    return (
      <div className="page-container">
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Contacts</h1>
                    <p className="page-subtitle">
                      Manage all your contacts, clients, and relationships
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    icon={<Plus size={16} />}
                    onClick={() => navigate('/contacts/new')}
                  >
                    New Contact
                  </Button>
                </div>
                <ContactList />
              </>
            }
          />
          <Route path="/new" element={<ContactForm />} />
          <Route path="/:id" element={<ContactDetail />} />
          <Route path="/:id/edit" element={<ContactForm />} />
        </Routes>
      </div>
    );
  }
  
  // Original Supabase-based implementation
  return (
    <ContactsProvider>
      <div className="page-container">
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Contacts</h1>
                    <p className="page-subtitle">
                      Manage all your contacts, clients, and relationships
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    icon={<Plus size={16} />}
                    onClick={() => navigate('/contacts/new')}
                  >
                    New Contact
                  </Button>
                </div>
                <ContactList />
              </>
            }
          />
          <Route path="/new" element={<ContactForm />} />
          <Route path="/:id" element={<ContactDetail />} />
          <Route path="/:id/edit" element={<ContactForm />} />
        </Routes>
      </div>
    </ContactsProvider>
  );
};

export default ContactsPage;
```

**File**: `/Users/michaelisrael/wszllp/src/components/documents/DocumentManagement.tsx`

Update to use DocumentListLocal when configured:

```typescript
// At the top of the file, add:
import DocumentListLocal from './DocumentListLocal';
import { dataSourceConfig } from '../../config/dataSourceConfig';

// Then in the component, replace the DocumentList usage with:
{dataSourceConfig.useLocalDataForDocuments ? (
  <DocumentListLocal />
) : (
  <DocumentList />
)}
```

**File**: `/Users/michaelisrael/wszllp/src/components/hearings/HearingsPage.tsx` (or wherever HearingList is used)

Update to use HearingListLocal when configured:

```typescript
// At the top of the file, add:
import HearingListLocal from './HearingListLocal';
import { dataSourceConfig } from '../../config/dataSourceConfig';

// Then replace HearingList usage with:
{dataSourceConfig.useLocalDataForHearings ? (
  <HearingListLocal temporalFilter={temporalFilter} />
) : (
  <HearingList temporalFilter={temporalFilter} />
)}
```

### Step 7: Add Data Sync Warning

**File**: `/Users/michaelisrael/wszllp/src/components/admin/EnhancedDataImporter.tsx`

Add a warning message after successful import (around line 225, after the result state update):

```typescript
{result && result.success && (
  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
    <h4 className="font-medium text-blue-800 mb-2">Important Note</h4>
    <p className="text-sm text-blue-700">
      Data has been imported to your local session. To persist this data permanently 
      and sync with the database, please use the sync feature in Settings or contact 
      your administrator.
    </p>
    <p className="text-sm text-blue-700 mt-2">
      The imported data is currently stored locally and will be visible in all tabs.
    </p>
  </div>
)}
```

## Testing Instructions

1. **Test Bulk Import Actions**:
   - Import a CSV file with multiple records
   - Verify success message shows correct counts
   - Check that data appears in respective tabs

2. **Test Each Tab**:
   - Cases: Should show imported cases immediately (already working)
   - Contacts: Should show imported contacts with local data enabled
   - Documents: Should show imported documents with local data enabled
   - Hearings: Should show imported hearings with local data enabled
   - Invoices: Should show imported invoices immediately (already working)

3. **Test Data Source Toggle**:
   - Toggle `dataSourceConfig` settings to false
   - Verify components revert to Supabase data
   - Toggle back to true to see local data again

## Future Improvements

1. **Data Synchronization**: Implement a sync mechanism to push local DataContext data to Supabase
2. **Unified Data Layer**: Refactor all components to use a single data source
3. **Import Preview**: Show a preview of data before importing with validation
4. **Duplicate Detection**: Check for existing records before importing
5. **Undo Import**: Add ability to rollback an import operation

## Notes

- The fix maintains backward compatibility by keeping both data sources
- Local storage is used to persist DataContext state between sessions
- Imported data will be lost if localStorage is cleared
- Consider implementing a proper data sync mechanism for production use
