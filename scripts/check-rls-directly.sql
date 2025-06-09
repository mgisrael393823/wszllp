-- SIMPLE RLS CHECK: Direct test with visible output

-- 1. First, let's see what we're working with
SELECT 'CURRENT RLS STATUS' as check_type, 
       tablename, 
       COUNT(*) as policy_count,
       bool_and(rowsecurity) as rls_enabled
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('cases', 'documents', 'contacts', 'hearings')
GROUP BY t.tablename;

-- 2. Check if we have any data to test with
SELECT 'DATA CHECK' as check_type,
       'cases' as table_name, 
       COUNT(*) as total_records,
       COUNT(DISTINCT user_id) as unique_users
FROM cases
UNION ALL
SELECT 'DATA CHECK',
       'users' as table_name, 
       COUNT(*) as total_records,
       COUNT(*) as unique_users
FROM auth.users;

-- 3. Test RLS directly - Get a case and try to access it
WITH test_data AS (
  SELECT 
    c.id as case_id,
    c.user_id as owner_id,
    c.plaintiff,
    u2.id as other_user_id
  FROM cases c
  CROSS JOIN LATERAL (
    SELECT id 
    FROM auth.users 
    WHERE id != c.user_id 
    LIMIT 1
  ) u2
  LIMIT 1
)
SELECT 
  'RLS TEST' as check_type,
  'Case ' || case_id as test_case,
  'Owner: ' || owner_id as owner,
  'Testing as: ' || other_user_id as test_user
FROM test_data;

-- 4. Test auth.uid() function
SELECT 
  'AUTH CHECK' as check_type,
  current_user as db_user,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'uid' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'))
    THEN 'auth.uid() function exists'
    ELSE 'auth.uid() function MISSING'
  END as auth_status;

-- 5. Show actual policies
SELECT 
  'POLICY DETAILS' as check_type,
  tablename,
  policyname,
  cmd,
  permissive,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'cases'
ORDER BY policyname;