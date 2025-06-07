# Tab Synchronization Enhancement Strategy

## Executive Summary

This document outlines a comprehensive strategy for enhancing data synchronization between the Cases, Hearings, Documents, and Contacts tabs, with a focus on ensuring proper data flow when e-filing submissions are created.

## Current State Analysis

### 1. E-Filing to Data Flow
- **Working**: E-filing creates case and document records via API
- **Issue**: No automatic UI refresh in tabs after creation
- **Issue**: Mixed state management (DataContext + direct Supabase queries)

### 2. Component Communication
- **Cases Tab**: Uses direct Supabase queries
- **Documents Tab**: Uses custom `useDocuments` hook
- **Hearings Tab**: Direct Supabase queries
- **Contacts Tab**: Uses ContactsProvider with local state

### 3. Key Gaps
- No real-time synchronization between tabs
- E-filing doesn't create hearings or link contacts
- Manual page refresh required to see new data

## Enhancement Strategy

### Phase 1: Immediate Fixes (Week 1)

#### 1.1 Fix E-Filing Data Creation
```typescript
// Enhance EFileSubmissionForm.tsx to refresh data after submission
const createCaseRecord = async (tylerData: any) => {
  // ... existing case creation logic ...
  
  // Broadcast update event
  window.dispatchEvent(new CustomEvent('case-created', { 
    detail: { caseId, source: 'efiling' } 
  }));
  
  return caseId;
};
```

#### 1.2 Add Event Listeners to Lists
```typescript
// In CaseList.tsx, DocumentList.tsx, etc.
useEffect(() => {
  const handleCaseCreated = () => {
    // Refetch data
    fetchCases();
  };
  
  window.addEventListener('case-created', handleCaseCreated);
  return () => window.removeEventListener('case-created', handleCaseCreated);
}, []);
```

### Phase 2: Unified Data Layer (Week 2)

#### 2.1 Create Central Data Service
```typescript
// src/services/dataSync.ts
import { supabase } from '@/lib/supabaseClient';

class DataSyncService {
  private listeners: Map<string, Set<Function>> = new Map();
  
  // Subscribe to Supabase real-time changes
  initializeSubscriptions() {
    // Cases subscription
    supabase
      .channel('cases-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cases' }, 
        (payload) => this.notifyListeners('cases', payload)
      )
      .subscribe();
      
    // Documents subscription
    supabase
      .channel('documents-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents' }, 
        (payload) => this.notifyListeners('documents', payload)
      )
      .subscribe();
  }
  
  // Register component listeners
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  private notifyListeners(table: string, payload: any) {
    this.listeners.get(table)?.forEach(callback => callback(payload));
  }
}

export const dataSyncService = new DataSyncService();
```

#### 2.2 Create Unified Data Provider
```typescript
// src/context/UnifiedDataContext.tsx
export const UnifiedDataProvider: React.FC = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  // Initialize real-time subscriptions
  useEffect(() => {
    dataSyncService.initializeSubscriptions();
    
    // Subscribe to updates
    const unsubscribers = [
      dataSyncService.on('cases', () => fetchCases()),
      dataSyncService.on('documents', () => fetchDocuments()),
      dataSyncService.on('hearings', () => fetchHearings()),
      dataSyncService.on('contacts', () => fetchContacts())
    ];
    
    // Initial fetch
    fetchAllData();
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);
  
  const value = {
    cases,
    documents,
    hearings,
    contacts,
    refetch: fetchAllData
  };
  
  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  );
};
```

### Phase 3: Enhanced E-Filing Integration (Week 3)

#### 3.1 Create Post-Submission Workflow
```typescript
// src/utils/efile/postSubmissionWorkflow.ts
export async function handlePostEFileSubmission(
  caseId: string, 
  formData: any, 
  tylerResponse: any
) {
  const tasks = [];
  
  // 1. Create default hearing if eviction case
  if (isEvictionCase(formData.caseType)) {
    tasks.push(createDefaultHearing(caseId, formData));
  }
  
  // 2. Create/link contacts
  if (formData.petitioner) {
    tasks.push(createOrLinkContact(caseId, formData.petitioner, 'petitioner'));
  }
  
  if (formData.defendants?.length > 0) {
    formData.defendants.forEach((defendant: any, index: number) => {
      tasks.push(createOrLinkContact(caseId, defendant, 'defendant', index));
    });
  }
  
  // 3. Create workflow tasks
  tasks.push(createEFilingWorkflow(caseId, tylerResponse));
  
  // Execute all tasks in parallel
  const results = await Promise.allSettled(tasks);
  
  // Log any failures but don't block
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Post-submission task ${index} failed:`, result.reason);
    }
  });
}

async function createDefaultHearing(caseId: string, formData: any) {
  // Create hearing 30 days from filing
  const hearingDate = new Date();
  hearingDate.setDate(hearingDate.getDate() + 30);
  
  return supabase.from('hearings').insert({
    case_id: caseId,
    hearing_date: hearingDate.toISOString(),
    hearing_time: '09:00:00',
    hearing_type: 'Initial Status',
    location: determineLocation(formData.jurisdiction),
    status: 'Scheduled',
    notes: 'Auto-created from e-filing submission'
  });
}

async function createOrLinkContact(
  caseId: string, 
  contactData: any, 
  role: string,
  index?: number
) {
  // Check if contact exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('*')
    .or(`email.eq.${contactData.email},and(first_name.eq.${contactData.firstName},last_name.eq.${contactData.lastName})`)
    .single();
    
  let contactId;
  if (existing) {
    contactId = existing.id;
  } else {
    // Create new contact
    const { data: newContact } = await supabase
      .from('contacts')
      .insert({
        first_name: contactData.firstName || contactData.businessName,
        last_name: contactData.lastName || '',
        email: contactData.email || '',
        phone: contactData.phone || '',
        address: contactData.addressLine1,
        city: contactData.city,
        state: contactData.state,
        zip: contactData.zipCode,
        contact_type: role
      })
      .select()
      .single();
      
    contactId = newContact?.id;
  }
  
  // Link to case
  if (contactId) {
    return supabase.from('case_contacts').insert({
      case_id: caseId,
      contact_id: contactId,
      role: role,
      is_primary: index === 0
    });
  }
}
```

### Phase 4: UI/UX Enhancements (Week 4)

#### 4.1 Add Loading States
```typescript
// src/components/ui/DataLoadingState.tsx
export const DataLoadingState = ({ 
  isLoading, 
  error, 
  onRetry,
  children 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorState 
        message="Failed to load data" 
        onRetry={onRetry} 
      />
    );
  }
  
  return <>{children}</>;
};
```

#### 4.2 Add Success Notifications
```typescript
// After e-filing submission
addToast({
  type: 'success',
  title: 'E-Filing Submitted Successfully',
  message: 'Case and documents have been created. Refreshing data...',
  actions: [
    {
      label: 'View Case',
      onClick: () => navigate(`/cases/${caseId}`)
    }
  ]
});
```

### Phase 5: Testing & Monitoring (Week 5)

#### 5.1 Create Integration Tests
```typescript
// tests/integration/efile-sync.test.ts
describe('E-Filing Data Synchronization', () => {
  it('should create case and documents after e-filing', async () => {
    // Submit e-filing
    const response = await submitEFiling(mockData);
    
    // Verify case created
    const caseData = await getCaseById(response.caseId);
    expect(caseData).toBeDefined();
    
    // Verify documents created
    const documents = await getDocumentsByCaseId(response.caseId);
    expect(documents).toHaveLength(mockData.files.length);
    
    // Verify UI updates
    await waitFor(() => {
      expect(screen.getByText(caseData.case_number)).toBeInTheDocument();
    });
  });
});
```

#### 5.2 Add Monitoring
```typescript
// src/utils/monitoring.ts
export function trackDataSync(event: string, data: any) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[DataSync] ${event}`, data);
  }
  
  // Send to analytics in production
  if (window.analytics) {
    window.analytics.track('data_sync', {
      event,
      ...data
    });
  }
}
```

## Implementation Timeline

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Immediate Fixes | Event-based refresh, Fix e-filing flow |
| 2 | Unified Data Layer | DataSyncService, UnifiedDataProvider |
| 3 | E-Filing Integration | Post-submission workflow, Auto-create hearings/contacts |
| 4 | UI/UX | Loading states, Notifications, Optimistic updates |
| 5 | Testing | Integration tests, Monitoring, Performance optimization |

## Success Metrics

1. **Data Consistency**: 100% of e-filings create corresponding cases/documents
2. **Real-time Updates**: < 2 seconds for UI to reflect new data
3. **User Satisfaction**: No manual refresh required
4. **Error Rate**: < 0.1% failed synchronizations

## Risk Mitigation

1. **Performance**: Implement pagination and lazy loading
2. **Race Conditions**: Use optimistic locking and conflict resolution
3. **Network Issues**: Implement retry logic and offline queue
4. **Browser Compatibility**: Test across all supported browsers

## Next Steps

1. Review and approve strategy
2. Create detailed technical specifications
3. Set up development environment
4. Begin Phase 1 implementation
5. Weekly progress reviews