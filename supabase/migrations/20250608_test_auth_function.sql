-- TEST AUTH.UID() FUNCTION
-- This tests if auth.uid() is working correctly with JWT claims

-- 1. Test auth.uid() without any JWT context (should be NULL or error)
SELECT 
  'NO JWT CONTEXT' as test_scenario,
  current_user as database_user,
  COALESCE(auth.uid()::text, 'NULL') as auth_uid_result;

-- 2. Set JWT context for a specific user
DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Get first user
  SELECT id INTO v_test_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  -- Set JWT claims
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_test_user_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
  
  -- Store for comparison
  PERFORM set_config('test.user_id', v_test_user_id::text, true);
END $$;

-- 3. Switch to authenticated role and test auth.uid()
SET LOCAL ROLE authenticated;

SELECT 
  'WITH JWT + AUTHENTICATED ROLE' as test_scenario,
  current_user as database_user,
  auth.uid() as auth_uid_result,
  current_setting('test.user_id')::uuid as expected_user_id,
  auth.uid() = current_setting('test.user_id')::uuid as matches_expected;

-- 4. Test if RLS is actually using auth.uid()
-- Create a simple test case
INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  auth.uid(),  -- Use auth.uid() directly
  'Auth Test',
  'Test',
  'Test',
  'Test'
);

-- Check if it was created with the right user_id
SELECT 
  'CASE CREATED WITH AUTH.UID()' as test_scenario,
  id,
  user_id,
  user_id = current_setting('test.user_id')::uuid as user_id_matches_jwt;
FROM public.cases
WHERE id = '33333333-3333-3333-3333-333333333333';

-- 5. Now switch to a different user and test visibility
DO $$
DECLARE
  v_other_user_id UUID;
BEGIN
  -- Get a different user
  SELECT id INTO v_other_user_id 
  FROM auth.users 
  WHERE id != current_setting('test.user_id')::uuid
  ORDER BY created_at 
  LIMIT 1;
  
  -- Set new JWT claims
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_other_user_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
END $$;

-- Still in authenticated role
SELECT 
  'DIFFERENT USER VISIBILITY TEST' as test_scenario,
  auth.uid() as current_auth_uid,
  COUNT(*) as visible_cases,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Other user cannot see the case'
    ELSE '❌ Other user CAN see the case!'
  END as result
FROM public.cases
WHERE id = '33333333-3333-3333-3333-333333333333';

-- 6. Cleanup
RESET ROLE;
DELETE FROM public.cases WHERE id = '33333333-3333-3333-3333-333333333333';

SELECT 'AUTH FUNCTION TEST COMPLETE' as status;