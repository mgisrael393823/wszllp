-- TEST AUTH.UID() FUNCTION - Fixed version

-- 1. Test auth.uid() in current context
SELECT 
  'CURRENT AUTH CONTEXT' as test_scenario,
  current_user as database_user,
  auth.uid() as auth_uid_result,
  CASE 
    WHEN auth.uid() IS NULL THEN 'No authenticated user'
    ELSE 'Authenticated as: ' || auth.uid()::text
  END as status;

-- 2. Create a test case using auth.uid()
INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  auth.uid(),
  'Auth Function Test',
  'Test Defendant',
  'Test Address',
  'Test Status'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verify the case was created with correct user_id
SELECT 
  'CASE CREATION TEST' as test_scenario,
  id,
  user_id,
  auth.uid() as current_auth_uid,
  user_id = auth.uid() as user_id_matches_auth;

-- 4. Test RLS by trying to see all cases
SELECT 
  'RLS VISIBILITY TEST' as test_scenario,
  COUNT(*) as total_visible_cases,
  COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_cases,
  COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_user_cases,
  CASE 
    WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 
    THEN '✅ RLS working: Cannot see other user cases'
    ELSE '❌ RLS issue: Can see ' || COUNT(CASE WHEN user_id != auth.uid() THEN 1 END)::text || ' other user cases'
  END as rls_status
FROM public.cases;

-- 5. Test if we can modify our own case
UPDATE public.cases 
SET status = 'Updated by owner'
WHERE id = '55555555-5555-5555-5555-555555555555'
  AND user_id = auth.uid()
RETURNING 
  'OWN CASE UPDATE TEST' as test_scenario,
  '✅ Can update own case' as result,
  id,
  status;

-- 6. Cleanup
DELETE FROM public.cases WHERE id = '55555555-5555-5555-5555-555555555555';

SELECT 'AUTH FUNCTION TEST COMPLETE' as status;