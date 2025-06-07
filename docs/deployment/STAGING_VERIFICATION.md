# Staging Verification Checklist

## Pre-Deployment Setup
- [ ] Branch `efiling-wspllz-process` deployed to staging environment
- [ ] Staging database migrations applied
- [ ] Environment variables configured for staging

## Database Verification
```bash
# Verify e-filing schema in staging
npm run verify:efile-schema
```
Expected: ✅ All e-filing columns exist and functional

## API Endpoint Testing
```bash
# Test case management integration against staging
npm run verify:case-management
```
Expected: ✅ Case and document creation functions work

## Manual E-Filing Flow Test (Incognito Browser)

### Step 1: Access Staging Environment
- [ ] Open incognito browser window
- [ ] Navigate to staging URL
- [ ] Login with test credentials

### Step 2: Complete E-Filing Submission
- [ ] Navigate to Documents → E-Filing
- [ ] Fill out complete e-filing form:
  - [ ] State: Illinois
  - [ ] County: Cook County  
  - [ ] Filing Type: Initial Filing
  - [ ] Case Type: Eviction
  - [ ] Attorney ID: [test ID]
  - [ ] Upload test document
- [ ] Submit form
- [ ] Verify "Submitting to Court..." loading state
- [ ] Verify "Saving Case Record..." loading state

### Step 3: Verify Tyler API Success
- [ ] Confirm "Filing Submitted" success message
- [ ] Note envelope ID from success message (format: envelope-xxx)
- [ ] Verify form resets after submission

### Step 4: Database Verification
```sql
-- Check case was created
SELECT * FROM cases 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 5;

-- Check document was created with e-filing data
SELECT id, case_id, envelope_id, filing_id, efile_status, efile_timestamp
FROM documents 
WHERE envelope_id IS NOT NULL 
ORDER BY created_at DESC LIMIT 5;
```

Expected Results:
- [ ] New case record exists with staging submission details
- [ ] New document record exists with Tyler envelope_id and filing_id
- [ ] efile_status = 'submitted'
- [ ] efile_timestamp matches submission time

## Error Handling Test
- [ ] Submit form with missing required fields
- [ ] Verify validation errors appear
- [ ] Verify no API calls made for invalid submissions

## Performance Test
- [ ] Monitor Tyler API response time (< 30 seconds)
- [ ] Monitor case management API response time (< 5 seconds)
- [ ] Verify no memory leaks or connection issues

## Staging Sign-off
- [ ] All database records created correctly
- [ ] Tyler integration unchanged and functional
- [ ] Case management integration working as designed
- [ ] No errors in staging logs
- [ ] Performance within acceptable limits

**Staging verification completed by:** _________________
**Date:** _________________
**Ready for production:** [ ] YES [ ] NO

**Notes:**
_________________________________________________________________
_________________________________________________________________