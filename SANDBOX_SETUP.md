# Sandbox Environment Setup

This document outlines how to set up and use the sandbox environment for demonstrations with Tyler Technologies or other external parties.

## Overview

The sandbox environment provides a completely isolated demo experience with:
- Realistic sample data (cases, contacts, documents, hearings)
- All application functionality working with demo data
- Clear visual indicators when in demo mode
- Zero access to production data

## Setup Instructions

### 1. Deploy Database Migration

Run the sandbox environment migration:
```bash
# Apply the migration to create sandbox tables and RLS policies
npm run migration:apply
# OR manually run the migration file in Supabase Dashboard
```

### 2. Create Demo User Account

In Supabase Auth Dashboard:
1. Go to Authentication > Users
2. Click "Create new user"
3. Set:
   - **Email**: `evictionsandbox@gmail.com`
   - **Password**: `SandboxDemo2024!`
   - **Email Confirmed**: ✅ (check the box)

### 3. Update Demo Data User IDs

After creating the user, get their UUID and update demo data:
```sql
-- Get the sandbox user ID
SELECT id FROM auth.users WHERE email = 'evictionsandbox@gmail.com';

-- Update demo data with the correct user_id
UPDATE sandbox_cases SET user_id = '<USER_UUID_HERE>';
UPDATE sandbox_contacts SET user_id = '<USER_UUID_HERE>';
UPDATE sandbox_documents SET user_id = '<USER_UUID_HERE>';
UPDATE sandbox_hearings SET user_id = '<USER_UUID_HERE>';
```

## Demo Credentials

**For Tyler Technologies Demo:**
- **Email**: `evictionsandbox@gmail.com`
- **Password**: `SandboxDemo2024!`
- **Environment**: Completely isolated sandbox with demo data

## What's Included in Demo Data

### Cases (3 sample cases)
1. **Eviction - 123 Main Street Apartment 2B**
   - Status: Active
   - Issue: Non-payment of rent (3 months)
   - Hearing: June 15, 2024

2. **Commercial Lease Dispute - ABC Store**
   - Status: Pending
   - Issue: Lease terms dispute
   - Hearing: June 20, 2024

3. **Eviction - 789 Oak Avenue Unit 5**
   - Status: Filed
   - Issue: Lease violations (pets, subletting)
   - Hearing: June 25, 2024

### Contacts (5 sample contacts)
- John Smith (Tenant)
- ABC Store Inc. (Commercial Tenant)
- Sarah Johnson (Problematic Tenant)
- Property Management Partners
- Cook County Sheriff Department

### Hearings (3 scheduled hearings)
- Eviction hearings and mediation sessions
- Realistic court locations and times

## Visual Indicators

When logged in as sandbox user:
- **Amber banner** at top: "🧪 DEMO MODE - Sample Data for Demonstration Purposes 🧪"
- All functionality works normally but only shows demo data
- E-filing integration works with Tyler API (real integration)

## Security Features

### Row Level Security (RLS)
- Sandbox user can ONLY see sandbox tables
- Production users can ONLY see production tables
- Complete data isolation enforced at database level

### Automatic Routing
- Application automatically detects sandbox user by email
- Routes all queries to `sandbox_*` tables
- No code changes needed in components

## Demonstration Script

### 1. Login & Overview
- Log in with sandbox credentials
- Point out the demo mode banner
- Show dashboard with sample KPIs

### 2. Cases Management
- Browse the 3 sample cases
- Show case details and status tracking
- Demonstrate case creation/editing

### 3. E-Filing Integration (Key Feature)
- Navigate to Documents > E-Filing
- Show the Tyler Technologies integration
- Click "Check E-filing Health Status" (works with real API)
- Demonstrate form submission (uses real Tyler API)

### 4. Contact Management
- Show sample contacts (tenants, property managers, court officials)
- Demonstrate contact creation and management

### 5. Calendar & Hearings
- Show scheduled hearings
- Demonstrate calendar integration

### 6. Document Management
- Show document upload and organization
- Demonstrate document templates

## Maintenance

### Adding More Demo Data
```sql
-- Add additional cases, contacts, etc. to sandbox tables
INSERT INTO sandbox_cases (...) VALUES (...);
```

### Resetting Demo Data
```sql
-- Clear and repopulate demo data if needed
DELETE FROM sandbox_cases;
-- Re-run demo data inserts
```

### Monitoring Usage
- Check Supabase logs for sandbox user activity
- Monitor demo sessions via auth logs

## Production Safety

- Sandbox user has **zero access** to production data
- RLS policies enforce complete isolation
- Database-level security prevents any data leakage
- Safe to use in production environment

## Support

For questions about the sandbox environment:
1. Check Supabase logs for any errors
2. Verify RLS policies are active
3. Confirm user email matches exactly: `evictionsandbox@gmail.com`