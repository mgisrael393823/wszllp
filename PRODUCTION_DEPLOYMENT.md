# Production Deployment Checklist

## Pre-Deployment Requirements
- [ ] ✅ Staging verification completed and signed off
- [ ] ✅ Code review approved by backend owner, frontend lead, and QA
- [ ] ✅ All tests passing (17/17 unit + 5/5 e2e)
- [ ] ✅ PR #50 ready for merge

## Deployment Process

### Step 1: Merge to Main
```bash
git checkout main
git pull origin main
git merge efiling-wspllz-process
git push origin main
```

### Step 2: Production Database Migration
```bash
# Apply migrations to production database
supabase db push --db-url [PRODUCTION_DB_URL]
```

### Step 3: Deploy to Production
```bash
# Via Vercel CLI
vercel --prod

# OR via Vercel Dashboard
# - Navigate to Vercel Dashboard
# - Select project
# - Deploy from main branch
```

### Step 4: Post-Deployment Verification

#### A. Schema Verification
```bash
npm run verify:efile-schema
```
Expected: ✅ E-filing columns exist in production database

#### B. Tyler Integration Health Check
```bash
npm run verify:tyler
```
Expected: ✅ Tyler API authentication successful

#### C. Production API Test
```bash
npm run test:production
```
Expected: ✅ E-filing submission works end-to-end

### Step 5: Manual Production Verification

#### Database Check (Production)
```sql
-- Verify e-filing schema exists
\d documents

-- Check for envelope_id, filing_id, efile_status, efile_timestamp columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('envelope_id', 'filing_id', 'efile_status', 'efile_timestamp');
```

#### Manual E-Filing Test (Production)
- [ ] Open incognito browser
- [ ] Navigate to production URL
- [ ] Login with production test account
- [ ] Complete one real e-filing submission
- [ ] Verify Tyler API success
- [ ] Check production database for case + document records

### Step 6: Monitoring Setup

#### First 50 Filings Monitoring
- [ ] Monitor Sentry/Datadog for errors
- [ ] Watch database for case creation failures
- [ ] Track Tyler API success rates
- [ ] Monitor API response times

#### Key Metrics to Watch
- Tyler API response time (target: < 30s)
- Case creation success rate (target: > 95%)
- Document creation success rate (target: > 95%)
- Overall e-filing success rate (maintain current rate)

### Step 7: Rollback Plan (If Needed)

#### Immediate Rollback
```bash
# Revert the merge commit
git revert <merge-commit-hash>
git push origin main

# Redeploy previous version
vercel --prod
```

#### Database Rollback (If Necessary)
```sql
-- Remove e-filing columns if causing issues
ALTER TABLE documents 
DROP COLUMN IF EXISTS envelope_id,
DROP COLUMN IF EXISTS filing_id,
DROP COLUMN IF EXISTS efile_status,
DROP COLUMN IF EXISTS efile_timestamp;

-- Drop functions if causing issues
DROP FUNCTION IF EXISTS create_case_with_transaction;
DROP FUNCTION IF EXISTS create_document_with_validation;
```

## Production Sign-off

### Deployment Verification
- [ ] Production deployment successful
- [ ] Database migrations applied
- [ ] E-filing schema verified
- [ ] Tyler integration unchanged
- [ ] Manual e-filing test successful
- [ ] Case and document records created
- [ ] No errors in production logs

### Monitoring Confirmation
- [ ] Error monitoring active
- [ ] Performance metrics baseline established
- [ ] Rollback plan tested and ready

**Production deployment completed by:** _________________
**Date:** _________________
**Deployment successful:** [ ] YES [ ] NO

**First production e-filing verification:**
- Envelope ID: _________________
- Case ID created: _________________
- Document ID created: _________________
- Submission time: _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________