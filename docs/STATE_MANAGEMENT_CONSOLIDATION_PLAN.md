# State Management Consolidation Plan

## Executive Summary

This document outlines the plan to migrate from the current hybrid DataContext + Refine setup to a unified state management solution. The goal is to eliminate duplicated logic, improve maintainability, and provide a consistent data layer across the application.

## Current State Analysis

### Current Architecture
1. **DataContext** (`src/context/DataContext.tsx`)
   - Legacy in-memory state management
   - Handles CRUD operations for cases, contacts, documents, etc.
   - Uses localStorage for persistence
   - Provides mock data in development

2. **Refine Integration**
   - Modern data provider framework
   - Supabase integration via `supabaseDataProvider`
   - Handles authentication and real-time updates
   - Used in newer components

3. **Hybrid Usage**
   - Some components use DataContext directly
   - Others use Refine hooks (`useList`, `useCreate`, etc.)
   - Inconsistent patterns across the codebase

### Problems with Current State
- **Duplication**: Same data fetching logic in multiple places
- **Inconsistency**: Different components use different patterns
- **Complexity**: Developers need to understand both systems
- **Performance**: Potential for redundant API calls
- **Type Safety**: Inconsistent type usage between systems

## Proposed Solution: Unified Refine Provider

### Architecture Overview
```
┌─────────────────────────────────────────────┐
│             Application Layer                │
├─────────────────────────────────────────────┤
│          Refine Hooks & Components          │
├─────────────────────────────────────────────┤
│         Unified Data Provider               │
│   (with backwards compatibility shim)       │
├─────────────────────────────────────────────┤
│    Supabase Client / Tyler API Client       │
└─────────────────────────────────────────────┘
```

### Key Components

1. **Unified Data Provider**
   ```typescript
   // src/providers/unifiedDataProvider.ts
   export const unifiedDataProvider = {
     ...supabaseDataProvider,
     // Custom methods for Tyler integration
     // Backwards compatibility methods
   };
   ```

2. **DataContext Compatibility Shim**
   ```typescript
   // src/providers/dataContextShim.tsx
   export const DataContextShim: React.FC = ({ children }) => {
     // Map DataContext methods to Refine hooks
     // Provide same interface for gradual migration
   };
   ```

3. **Type-Safe Hooks**
   ```typescript
   // src/hooks/useTypedData.ts
   export const useTypedCases = () => useList<Case>({ resource: 'cases' });
   export const useTypedContacts = () => useList<Contact>({ resource: 'contacts' });
   ```

## Migration Strategy

### Phase A: Preparation (Week 1)
1. **Audit Current Usage**
   - [ ] List all components using DataContext
   - [ ] List all components using Refine hooks
   - [ ] Identify shared data dependencies

2. **Create Migration Infrastructure**
   - [ ] Implement unified data provider
   - [ ] Create DataContext compatibility shim
   - [ ] Set up feature flags for gradual rollout

3. **Testing Framework**
   - [ ] Unit tests for compatibility shim
   - [ ] Integration tests for data consistency
   - [ ] E2E tests for critical workflows

### Phase B: Core Migration (Weeks 2-3)
1. **Migrate Read Operations**
   - [ ] Cases list and detail views
   - [ ] Contacts list and detail views
   - [ ] Documents list and management
   - [ ] Hearings and calendaring

2. **Migrate Write Operations**
   - [ ] Case creation and updates
   - [ ] Document uploads and e-filing
   - [ ] Contact management
   - [ ] Invoice and payment tracking

3. **Migrate Complex Features**
   - [ ] Workflow automation
   - [ ] Notification system
   - [ ] Dashboard analytics

### Phase C: Cleanup (Week 4)
1. **Remove Legacy Code**
   - [ ] Remove DataContext implementation
   - [ ] Remove compatibility shim
   - [ ] Update all imports

2. **Optimization**
   - [ ] Implement caching strategies
   - [ ] Add real-time subscriptions
   - [ ] Optimize query patterns

## Implementation Details

### Component Migration Pattern
```typescript
// Before (DataContext)
const CaseList = () => {
  const { cases, loading, fetchCases } = useData();
  useEffect(() => { fetchCases(); }, []);
  return <div>{cases.map(...)}</div>;
};

// After (Refine)
const CaseList = () => {
  const { data, isLoading } = useList<Case>({ 
    resource: 'cases',
    pagination: { pageSize: 20 }
  });
  return <div>{data?.data.map(...)}</div>;
};
```

### Data Provider Extensions
```typescript
// Tyler API Integration
const tylerMethods = {
  submitEFiling: async (data: EFileSubmission) => {
    // Tyler API logic
  },
  checkFilingStatus: async (envelopeId: string) => {
    // Tyler API logic
  }
};

// Extend base provider
export const unifiedDataProvider = {
  ...supabaseDataProvider(supabaseClient),
  custom: tylerMethods
};
```

### Type Safety Improvements
```typescript
// Define resource map
interface ResourceMap {
  cases: Case;
  contacts: Contact;
  documents: Document;
  hearings: Hearing;
}

// Type-safe hooks
export function useTypedList<T extends keyof ResourceMap>(
  resource: T,
  options?: UseListOptions
) {
  return useList<ResourceMap[T]>({ 
    resource, 
    ...options 
  });
}
```

## Risk Mitigation

### Backwards Compatibility
- Maintain DataContext interface during migration
- Use feature flags for gradual rollout
- Provide fallback mechanisms

### Performance Considerations
- Implement request deduplication
- Add caching layer
- Monitor API usage metrics

### Testing Strategy
- Unit tests for all data operations
- Integration tests for critical paths
- Performance benchmarks
- User acceptance testing

## Success Metrics

1. **Code Quality**
   - Reduction in duplicated code (target: -60%)
   - Improved type coverage (target: 95%)
   - Consistent patterns across codebase

2. **Performance**
   - Reduced API calls (target: -30%)
   - Faster page load times
   - Better caching efficiency

3. **Developer Experience**
   - Simpler onboarding for new developers
   - Clearer documentation
   - Reduced debugging time

## Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Preparation | Audit complete, infrastructure ready |
| 2-3 | Core Migration | All components migrated, tests passing |
| 4 | Cleanup | Legacy code removed, optimization complete |

## Next Steps

1. **Review with team** - Get feedback on approach
2. **Create tracking issues** - Break down into specific tasks
3. **Set up monitoring** - Track migration progress
4. **Begin Phase A** - Start with audit and infrastructure

## Appendix: Component Inventory

### Components Using DataContext
- `src/components/cases/CaseList.tsx`
- `src/components/cases/CaseForm.tsx`
- `src/components/contacts/ContactList.tsx`
- `src/components/documents/DocumentList.tsx`
- `src/components/dashboard/DashboardHome.tsx`
- (Full list to be completed during audit)

### Components Using Refine
- `src/components/admin/RefineImportTool.tsx`
- `src/components/efile/EFileSubmissionForm.tsx`
- (Full list to be completed during audit)

---

*This document is a living plan and will be updated as the migration progresses.*