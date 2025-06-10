# Component Audit - State Management Usage

This document tracks which components use DataContext vs Refine for state management.

## Summary
- **Total Components**: TBD
- **Using DataContext**: TBD
- **Using Refine**: TBD
- **Using Both**: TBD
- **Using Neither**: TBD

## Components Using DataContext

### Cases
- [ ] `src/components/cases/CaseList.tsx`
- [ ] `src/components/cases/CaseForm.tsx`
- [ ] `src/components/cases/CaseDetail.tsx`
- [ ] `src/components/cases/CasesPage.tsx`
- [ ] `src/components/cases/NewCasePage.tsx`

### Contacts
- [ ] `src/components/contacts/ContactList.tsx`
- [ ] `src/components/contacts/ContactForm.tsx`
- [ ] `src/components/contacts/ContactDetail.tsx`
- [ ] `src/components/contacts/ContactsPage.tsx`

### Documents
- [ ] `src/components/documents/DocumentList.tsx`
- [ ] `src/components/documents/DocumentForm.tsx`
- [ ] `src/components/documents/DocumentDetail.tsx`
- [ ] `src/components/documents/DocumentManagement.tsx`
- [ ] `src/components/documents/DocumentUpload.tsx`

### Hearings
- [ ] `src/components/hearings/HearingList.tsx`
- [ ] `src/components/hearings/HearingForm.tsx`
- [ ] `src/components/hearings/HearingsPage.tsx`

### Dashboard
- [ ] `src/components/dashboard/DashboardHome.tsx`
- [ ] `src/components/dashboard/EnhancedDashboardHome.tsx`

### Other
- [ ] `src/components/invoices/InvoiceList.tsx`
- [ ] `src/components/invoices/InvoiceForm.tsx`
- [ ] `src/components/service-logs/ServiceLogsList.tsx`
- [ ] `src/components/service-logs/ServiceLogForm.tsx`

## Components Using Refine

### Admin/Import
- [ ] `src/components/admin/RefineImportTool.tsx`
- [ ] `src/components/admin/DataImportPage.tsx`

### E-Filing
- [ ] `src/components/efile/EFileSubmissionForm.tsx`
- [ ] `src/components/efile/EFilePage.tsx`

## Components Using Both

### TBD
- Components that mix both patterns

## Components Using Neither

### UI Components
- All components in `src/components/ui/` (pure presentation)
- Layout components (`Header`, `Sidebar`, `MainLayout`)

## Migration Priority

### High Priority (Core functionality)
1. Cases - Central to the application
2. Documents - Critical for e-filing
3. Contacts - Widely referenced

### Medium Priority
4. Hearings
5. Dashboard
6. Invoices

### Low Priority
7. Service Logs
8. Workflows
9. Notifications

## Notes

### DataContext Pattern
```typescript
const { cases, loading, error, createCase } = useData();
```

### Refine Pattern
```typescript
const { data, isLoading, error } = useList({ resource: 'cases' });
const { mutate: createCase } = useCreate({ resource: 'cases' });
```

### Migration Checklist per Component
- [ ] Identify all DataContext usage
- [ ] Map to equivalent Refine hooks
- [ ] Update imports
- [ ] Update component logic
- [ ] Test functionality
- [ ] Update related components

---

*This audit will be completed in Phase 3, Week 1*