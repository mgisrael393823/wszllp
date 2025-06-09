-- RLS TEST - Fixed version without auth.users access

-- 1. Create a test case with a known ID
INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  auth.uid(),  -- Use current user's ID
  'RLS Test Case',
  'Test Defendant',
  '123 Test St',
  'Active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Verify what we created
SELECT 
  'TEST CASE' as info,
  id,
  user_id,
  plaintiff,
  status,
  auth.uid() as current_user_id,
  user_id = auth.uid() as is_mine
FROM public.cases 
WHERE id = '44444444-4444-4444-4444-444444444444';

-- 3. Get a different user's case (one we don't own)
WITH other_cases AS (
  SELECT id, user_id 
  FROM public.cases 
  WHERE user_id != auth.uid() 
  LIMIT 1
)
SELECT 
  'OTHER USER CASE' as info,
  id as other_case_id,
  user_id as other_user_id,
  auth.uid() as my_user_id
FROM other_cases;

-- 4. Try to update a case we don't own
UPDATE public.cases 
SET status = 'HACKED' 
WHERE user_id != auth.uid()
AND id = (SELECT id FROM public.cases WHERE user_id != auth.uid() LIMIT 1)
RETURNING 
  'UPDATE TEST' as test,
  '❌ FAIL: Could update another user case!' as result,
  id,
  user_id,
  status;

-- If no rows returned, update was blocked (good!)

-- 5. Try to delete a case we don't own
DELETE FROM public.cases 
WHERE user_id != auth.uid()
AND id = (SELECT id FROM public.cases WHERE user_id != auth.uid() LIMIT 1)
RETURNING 
  'DELETE TEST' as test,
  '❌ FAIL: Could delete another user case!' as result,
  id;

-- If no rows returned, delete was blocked (good!)

-- 6. Verify our own case is still there and unchanged
SELECT 
  'MY CASE STATUS' as info,
  id,
  status,
  CASE 
    WHEN status = 'Active' THEN '✅ My case unchanged'
    ELSE '❌ My case was modified!'
  END as result
FROM public.cases 
WHERE id = '44444444-4444-4444-4444-444444444444';

-- 7. Count what we can see
SELECT 
  'VISIBILITY TEST' as info,
  COUNT(*) as total_cases_i_can_see,
  COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_cases,
  COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_user_cases,
  CASE 
    WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 
    THEN '✅ Cannot see other user cases'
    ELSE '❌ Can see other user cases!'
  END as result
FROM public.cases;

-- 8. Cleanup our test case
DELETE FROM public.cases WHERE id = '44444444-4444-4444-4444-444444444444';

SELECT 'TEST COMPLETE' as status, 'Check results above' as message;