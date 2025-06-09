-- SIMPLE RLS TEST - Run each section separately to see results

-- 1. First, check your users
SELECT 
  'AVAILABLE USERS' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at
LIMIT 5;

-- 2. Create a test case as User 1 (run as superuser)
INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid,
  id,
  'Simple RLS Test',
  'Test Defendant',
  '123 Test St',
  'Active'
FROM auth.users 
ORDER BY created_at 
LIMIT 1
ON CONFLICT (id) DO UPDATE SET status = 'Active';

-- 3. Verify the case was created
SELECT 
  'CREATED CASE' as info,
  id,
  user_id,
  plaintiff,
  status
FROM public.cases 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 4. Now simulate User 2 trying to access User 1's case
-- First set up User 2's JWT context
DO $$
DECLARE
  v_user2_id UUID;
BEGIN
  -- Get the second user
  SELECT id INTO v_user2_id 
  FROM auth.users 
  WHERE id != (SELECT user_id FROM public.cases WHERE id = '22222222-2222-2222-2222-222222222222')
  ORDER BY created_at 
  LIMIT 1;
  
  -- Set JWT claims
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_user2_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
  
  -- Log what we're doing
  RAISE LOG 'Set JWT for user: %', v_user2_id;
END $$;

-- Switch to authenticated role
SET LOCAL ROLE authenticated;

-- 5. Test what User 2 can see
SELECT 
  'USER 2 SELECT TEST' as test,
  COUNT(*) as can_see_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ FAIL: User 2 CAN see User 1 case!'
    ELSE '✅ PASS: User 2 cannot see User 1 case'
  END as result
FROM public.cases 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 6. Test if User 2 can update
UPDATE public.cases 
SET status = 'HACKED' 
WHERE id = '22222222-2222-2222-2222-222222222222'
RETURNING 'USER 2 UPDATE TEST' as test, 
          '❌ FAIL: User 2 CAN update!' as result,
          id,
          status;

-- If no rows returned above, the update was blocked

-- 7. Test if User 2 can delete
DELETE FROM public.cases 
WHERE id = '22222222-2222-2222-2222-222222222222'
RETURNING 'USER 2 DELETE TEST' as test,
          '❌ FAIL: User 2 CAN delete!' as result,
          id;

-- If no rows returned above, the delete was blocked

-- 8. Reset and check final state
RESET ROLE;

SELECT 
  'FINAL STATE' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.cases WHERE id = '22222222-2222-2222-2222-222222222222')
    THEN 'Case still exists'
    ELSE 'Case was deleted!'
  END as status,
  status as case_status
FROM public.cases 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 9. Cleanup
DELETE FROM public.cases WHERE id = '22222222-2222-2222-2222-222222222222';