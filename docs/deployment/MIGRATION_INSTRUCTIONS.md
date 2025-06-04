# 🗄️ Manual Migration Instructions

## Step-by-Step SQL Execution

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `karvbtpygbavvqydfcju`
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### 2. Execute Migrations in Order

**⚠️ IMPORTANT: Run these in EXACT order, one at a time**

#### Migration 1: Create Contacts Table
```sql
-- File: 20250523160000_create_contacts_table.sql
-- Copy and paste the ENTIRE contents of this file
```

#### Migration 2: Create Case-Contacts Junction Table  
```sql
-- File: 20250523160001_create_case_contacts_table.sql
-- Copy and paste the ENTIRE contents of this file
```

#### Migration 3: Create Communications Table
```sql
-- File: 20250523160002_create_contact_communications_table.sql  
-- Copy and paste the ENTIRE contents of this file
```

#### Migration 4: Enhanced RLS Policies
```sql
-- File: 20250523160003_enhanced_rls_policies.sql
-- Copy and paste the ENTIRE contents of this file
```

#### Migration 5: Monitoring & Version Tracking
```sql
-- File: 20250523160004_schema_versioning_and_monitoring.sql
-- Copy and paste the ENTIRE contents of this file
```

### 3. File Locations
All migration files are in: `supabase/migrations/`

### 4. Execution Tips
- Run each migration completely before moving to the next
- Click "Run" button after pasting each migration
- If you see "already exists" warnings, that's normal
- Look for success message: "Success. No rows returned" or similar

### 5. After All Migrations
Once you've run all 5 migrations, return to the terminal and run:
```bash
npm run migration:validate post-validate
```

## Expected Results
After successful execution, you should have:
- ✅ `contacts` table with RLS enabled
- ✅ `case_contacts` junction table  
- ✅ `contact_communications` table
- ✅ `schema_versions` tracking table
- ✅ All necessary indexes and policies
- ✅ Automatic triggers for timestamps

## Troubleshooting
If any migration fails:
1. Note the error message
2. Check if it's a "already exists" warning (safe to ignore)
3. If it's a real error, stop and report the issue
4. Do NOT continue with subsequent migrations if there's a real error

## Ready to Continue?
After successful migration execution, we'll continue with:
1. Post-migration validation
2. Switch ContactsProvider to Supabase
3. Migrate existing localStorage data
4. Test functionality