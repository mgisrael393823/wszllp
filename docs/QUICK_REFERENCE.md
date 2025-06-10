# Quick Reference - WSZ LLP Project

## Current Status (Jan 9, 2025)
- **Active Branch**: `state-consolidation`
- **Current Phase**: 3 - State Management Consolidation
- **Next Task**: Complete component audit

## Environment Variables
```bash
export SUPABASE_URL=https://karvbtpygbavvqydfcju.supabase.co
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDk0MDksImV4cCI6MjA2MjM4NTQwOX0.dHTzkJ_IwXeBfR5QLDRLw8XZTVCmeLBMRi0oQgUX5wk
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjgwOTQwOSwiZXhwIjoyMDYyMzg1NDA5fQ.CFpy0tiFC5kldHEJcQlfnnqWeBazYdMa9RYw8VLg3h4
```

## Most Used Commands
```bash
# Test RLS security
npm run test:rls:fixed

# Check TypeScript
npx tsc --noEmit

# Build project
npm run build

# Run dev server
npm run dev
```

## Key Files to Track
- `/docs/PROJECT_ACTION_ITEMS.md` - Master task list
- `/docs/STATE_MANAGEMENT_CONSOLIDATION_PLAN.md` - Phase 3 details
- `/docs/COMPONENT_AUDIT.md` - Current migration progress
- `/src/types/schema.ts` - Updated TypeScript schemas

## Session Recovery
```bash
# 1. Check where you are
git status
git branch --show-current

# 2. Continue Phase 3 work
git checkout state-consolidation
cat docs/COMPONENT_AUDIT.md

# 3. Run tests to verify state
npm run test:rls:fixed
```

## Tyler E-Filing Credentials
- **Username**: czivin@wolfsolovy.com
- **Password**: Zuj90820*
- **Client Token**: EVICT87
- **Base URL**: https://api.uslegalpro.com/v4

## GitHub
- **Repo**: https://github.com/mgisrael393823/wszllp
- **Latest PR**: #71 (merged - Schema Sync)
- **Active Branch**: state-consolidation

---
*Keep this file open in a separate tab for quick reference*