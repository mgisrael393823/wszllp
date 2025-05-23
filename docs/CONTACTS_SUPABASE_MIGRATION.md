# Contacts Supabase Migration Plan

## 🎯 Migration Strategy

### Phase 1: Database Setup (Current)
- ✅ Create contacts table schema
- ✅ Create case_contacts junction table  
- ✅ Create contact_communications table (future)
- ✅ Design Supabase data provider

### Phase 2: Data Provider Migration
1. **Update ContactsProvider** to use Supabase data provider
2. **Dual Mode Support** - read from both localStorage and Supabase during transition
3. **Data Migration Utility** - move existing localStorage contacts to Supabase
4. **Backwards Compatibility** - ensure existing components work without changes

### Phase 3: Component Updates
1. **Contact Form** - handle Supabase ID format (UUID vs string)
2. **Contact List** - optimize for Supabase queries and pagination
3. **Contact Detail** - add case relationships and communication history
4. **Error Handling** - improve error states for network issues

### Phase 4: Integration Features
1. **Case-Contact Links** - add contacts to case detail pages
2. **Contact-Case Links** - show related cases on contact detail
3. **Communication Logging** - basic notes/interaction tracking

## 🔧 Implementation Steps

### Step 1: Apply Database Migrations

```bash
# Apply the contacts table migration
npx supabase db push --db-url "postgresql://postgres.{ref}:{password}@{host}:6543/postgres"
```

### Step 2: Update ContactsProvider

```typescript
// src/components/contacts/ContactsProvider.tsx
import { createSupabaseDataProvider } from '../../utils/refine/supabaseDataProvider';

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // Switch from context-based to Supabase-based data provider
  const dataProvider = createSupabaseDataProvider();

  return (
    <Refine
      dataProvider={dataProvider}
      // ... rest of config
    >
      {children}
    </Refine>
  );
};
```

### Step 3: Create Migration Utility

```typescript
// src/utils/migration/contactsMigration.ts
export const migrateContactsToSupabase = async () => {
  // Read contacts from localStorage
  const localData = localStorage.getItem('legalCaseData');
  if (!localData) return;

  const data = JSON.parse(localData);
  const contacts = data.contacts || [];

  // Migrate each contact to Supabase
  for (const contact of contacts) {
    await supabase.from('contacts').insert({
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      address: contact.address,
      notes: contact.notes,
    });
  }
};
```

### Step 4: Update Type Definitions

```typescript
// src/types/schema.ts - Update Contact interface
export interface Contact {
  id: string; // Change from contactId to id (UUID)
  name: string;
  role: 'Attorney' | 'Paralegal' | 'PM' | 'Client' | 'Other';
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  created_at: string; // Change from createdAt to created_at
  updated_at: string; // Change from updatedAt to updated_at
}

// Add new interfaces
export interface CaseContact {
  id: string;
  case_id: string;
  contact_id: string;
  relationship_type: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

## 🔄 Backwards Compatibility Strategy

### Field Mapping
- `contactId` → `id` (UUID)
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### Component Updates Required
1. **ContactList.tsx** - Update keyField from `contactId` to `id`
2. **ContactForm.tsx** - Handle UUID vs string IDs
3. **ContactDetail.tsx** - Update URL params and ID handling

### Migration Helpers
```typescript
// Helper function to map Supabase contact to legacy format
export const mapSupabaseToLegacy = (contact: SupabaseContact): Contact => ({
  contactId: contact.id,
  name: contact.name,
  role: contact.role,
  email: contact.email,
  phone: contact.phone,
  company: contact.company,
  address: contact.address,
  notes: contact.notes,
  createdAt: contact.created_at,
  updatedAt: contact.updated_at,
});
```

## 🧪 Testing Strategy

### Unit Tests
- Test data provider CRUD operations
- Test field mapping functions
- Test migration utilities

### Integration Tests
- Test contact creation/editing with Supabase
- Test case-contact linking
- Test search and filtering

### E2E Tests
```typescript
// cypress/e2e/contacts-supabase.cy.ts
describe('Contacts with Supabase', () => {
  it('should create, edit, and delete contacts', () => {
    // Test full CRUD workflow
  });
  
  it('should link contacts to cases', () => {
    // Test case-contact relationships
  });
});
```

## 📊 Performance Considerations

### Pagination
- Use Supabase's built-in pagination with `range()`
- Implement infinite scroll for large contact lists

### Caching
- Use React Query (built into Refine) for client-side caching
- Cache frequently accessed contact lists

### Indexing
- Database indexes on name, email, role for fast searches
- Composite indexes on case_contacts for relationship queries

## 🚀 Rollout Plan

### Development Environment
1. Apply migrations to dev database
2. Update components incrementally
3. Test migration utility with sample data

### Production Rollout
1. **Backup**: Export all localStorage data
2. **Deploy**: Push database migrations
3. **Migrate**: Run data migration utility
4. **Switch**: Update ContactsProvider to use Supabase
5. **Verify**: Test all contact functionality
6. **Monitor**: Watch for errors and performance issues

## 🔮 Future Enhancements

### Phase 5: Advanced Features
- **Bulk Operations**: Import/export contacts via CSV
- **Search**: Full-text search across all contact fields
- **Relationships**: Complex contact relationship mapping
- **Communication**: Email integration and call logging

### Phase 6: Multi-User Features
- **User Permissions**: Role-based access to contacts
- **Activity Tracking**: Who modified what and when
- **Real-time Updates**: Live updates across multiple users
- **Conflict Resolution**: Handle concurrent edits

## 📝 Success Metrics

### Migration Success
- [ ] All localStorage contacts migrated without data loss
- [ ] All existing functionality works identically
- [ ] No performance degradation in contact operations

### Feature Success  
- [ ] Contacts can be linked to cases with roles
- [ ] Case detail pages show related contacts
- [ ] Contact detail pages show related cases
- [ ] Communication history can be logged and viewed

### Performance Success
- [ ] Contact list loads in <2 seconds with 1000+ contacts
- [ ] Search results return in <500ms
- [ ] Real-time updates work smoothly across multiple users