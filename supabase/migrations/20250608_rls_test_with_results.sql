-- RLS TEST WITH VISIBLE RESULTS
-- This version returns result sets that Supabase SQL editor will display

-- Step 1: Get test users
WITH test_users AS (
  SELECT 
    u1.id as user1_id,
    u2.id as user2_id
  FROM 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) u1,
    (SELECT id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1) u2
)
SELECT 
  'TEST USERS' as test_step,
  user1_id as "User 1 ID",
  user2_id as "User 2 ID"
FROM test_users;

-- Step 2: Create a test case (as superuser)
DO $$
DECLARE
  v_user1_id UUID;
BEGIN
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  -- Delete any existing test case
  DELETE FROM public.cases WHERE id = '11111111-1111-1111-1111-111111111111';
  
  -- Create new test case
  INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
  VALUES ('11111111-1111-1111-1111-111111111111', v_user1_id, 'RLS Test', 'Test Defendant', '123 Test St', 'Active');
END $$;

-- Step 3: Verify test case was created
SELECT 
  'TEST CASE CREATED' as test_step,
  id as case_id,
  user_id as owner_id,
  plaintiff,
  status
FROM public.cases 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Step 4: Test as User 2 - First set the context
DO $$
DECLARE
  v_user2_id UUID;
BEGIN
  SELECT id INTO v_user2_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
  
  -- Set JWT claims for User 2
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_user2_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
END $$;

-- Switch to authenticated role
SET LOCAL ROLE authenticated;

-- Step 5: Test SELECT as User 2
SELECT 
  'SELECT TEST' as test_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.cases WHERE id = '11111111-1111-1111-1111-111111111111')
    THEN '❌ FAIL: User 2 CAN see User 1 case'
    ELSE '✅ PASS: User 2 CANNOT see User 1 case'
  END as result;

-- Step 6: Test UPDATE as User 2
WITH update_test AS (
  UPDATE public.cases 
  SET status = 'HACKED BY USER 2' 
  WHERE id = '11111111-1111-1111-1111-111111111111'
  RETURNING id
)
SELECT 
  'UPDATE TEST' as test_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM update_test)
    THEN '❌ FAIL: User 2 CAN update User 1 case'
    ELSE '✅ PASS: User 2 CANNOT update User 1 case'
  END as result;

-- Step 7: Test DELETE as User 2
WITH delete_test AS (
  DELETE FROM public.cases 
  WHERE id = '11111111-1111-1111-1111-111111111111'
  RETURNING id
)
SELECT 
  'DELETE TEST' as test_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM delete_test)
    THEN '❌ FAIL: User 2 CAN delete User 1 case'
    ELSE '✅ PASS: User 2 CANNOT delete User 1 case'
  END as result;

-- Step 8: Reset role and check if case still exists
RESET ROLE;

SELECT 
  'FINAL CHECK' as test_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.cases WHERE id = '11111111-1111-1111-1111-111111111111')
    THEN 'Case still exists after tests'
    ELSE 'Case was deleted during tests'
  END as result;

-- Step 9: Test auth.uid() function
DO $$
DECLARE
  v_user2_id UUID;
BEGIN
  SELECT id INTO v_user2_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
  
  -- Set JWT claims again
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_user2_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
END $$;

SET LOCAL ROLE authenticated;

SELECT 
  'AUTH.UID() TEST' as test_step,
  auth.uid() as auth_uid_result,
  (SELECT id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1) as expected_user2_id,
  CASE 
    WHEN auth.uid() = (SELECT id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1)
    THEN '✅ auth.uid() returns correct User 2 ID'
    ELSE '❌ auth.uid() mismatch or NULL'
  END as result;

-- Step 10: Cleanup
RESET ROLE;
DELETE FROM public.cases WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT 'TEST COMPLETE' as test_step, 'Check results above' as result;