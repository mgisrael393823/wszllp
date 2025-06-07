# Production Fix Instructions

## Issues Fixed

1. **Sample cases appearing in production**
   - Removed test/sample cases from the database
   
2. **Dashboard 404 errors**
   - Added fallback to query metrics directly when materialized view doesn't exist
   - Dashboard service now handles missing `dashboard_combined_metrics` table gracefully

3. **Case detail blank page**
   - Fixed navigation route from `/dashboard/cases/:id` to `/cases/:id`
   - Added support for both routes for backward compatibility

## Code Changes Made

### 1. Dashboard Service Enhancement
- **File**: `src/services/dashboardService.ts`
- **Changes**: 
  - Added `getDashboardMetricsDirect()` method to query metrics directly from tables
  - Added error handling to fall back when materialized view doesn't exist
  - Dashboard now works without the materialized view (though performance is better with it)

### 2. Case Navigation Fix
- **File**: `src/components/cases/CaseList.tsx`
- **Change**: Fixed navigation from `/dashboard/cases/${id}` to `/cases/${id}`
- **File**: `src/App.tsx`
- **Change**: Added route for `/dashboard/cases/:id` for backward compatibility

## Deployment Steps

### 1. Run Production Hotfix Script
```bash
# Install dependencies if needed
npm install

# Run the hotfix script
node scripts/production-hotfix.js
```

This script will:
- Remove sample cases from production
- Provide instructions for creating dashboard views

### 2. Deploy Code Changes
Deploy the latest code to production with the fixes:
- Updated dashboard service with fallback metrics
- Fixed case navigation routes

### 3. Clear Browser Cache
Users should clear their browser cache and localStorage:
1. Visit `/clear-localstorage.html` on your domain
2. Or manually clear localStorage in browser dev tools

### 4. Optional: Create Dashboard Views
For better performance, create the dashboard materialized view:

1. Go to Supabase Dashboard > SQL Editor
2. Run the migration file: `supabase/migrations/20250526000000_create_dashboard_materialized_views.sql`

Note: The app works without this view, but performance is better with it.

## Verification Steps

After deployment:

1. **Check Cases Page**
   - Verify no sample cases appear
   - Click on a case to verify detail page loads correctly

2. **Check Dashboard**
   - Verify dashboard loads without errors
   - Metrics should display (even if all zeros for empty database)

3. **Check Browser Console**
   - No 404 errors for dashboard_metrics
   - No navigation errors when clicking cases

## Rollback Plan

If issues persist:
1. The code changes are backward compatible
2. Dashboard will work with or without materialized views
3. Both old and new case routes are supported

## Support

If you encounter issues:
1. Check browser console for errors
2. Clear localStorage and try again
3. Verify Supabase connection is working