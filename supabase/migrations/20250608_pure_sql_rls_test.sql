-- PURE SQL RLS TEST: Definitive test at database level

DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_test_case_id UUID := '11111111-1111-1111-1111-111111111111';
  v_update_count INTEGER;
  v_select_count INTEGER;
  v_delete_count INTEGER;
BEGIN
  RAISE NOTICE '=== PURE SQL RLS TEST ===';
  RAISE NOTICE 'This test runs entirely in SQL with proper role switching';
  RAISE NOTICE '';
  
  -- Get two real users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE EXCEPTION 'Need at least 2 users in auth.users table';
  END IF;
  
  RAISE NOTICE 'User 1 (owner): %', v_user1_id;
  RAISE NOTICE 'User 2 (attacker): %', v_user2_id;
  RAISE NOTICE '';
  
  -- Step 1: Insert as superuser/service role
  RAISE NOTICE 'Step 1: Creating test case as service role...';
  INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_case_id, v_user1_id, 'SQL RLS Test', 'Test Defendant', '123 Test St', 'Active');
  RAISE NOTICE '✓ Created case owned by User 1';
  RAISE NOTICE '';
  
  -- Step 2: Test as User 2 (authenticated role with different auth.uid())
  RAISE NOTICE 'Step 2: Testing as User 2 (authenticated)...';
  
  -- Set JWT claims to simulate User 2
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_user2_id::text,
      'role', 'authenticated',
      'email', 'user2@test.com'
    )::text, 
    true  -- local to transaction
  );
  
  -- Switch to authenticated role
  SET LOCAL ROLE authenticated;
  
  -- Test SELECT
  RAISE NOTICE 'Testing SELECT...';
  SELECT COUNT(*) INTO v_select_count FROM public.cases WHERE id = v_test_case_id;
  IF v_select_count > 0 THEN
    RAISE WARNING '❌ RLS VIOLATION: User 2 can SELECT User 1 case!';
  ELSE
    RAISE NOTICE '✅ SELECT blocked correctly (found 0 rows)';
  END IF;
  
  -- Test UPDATE
  RAISE NOTICE 'Testing UPDATE...';
  BEGIN
    UPDATE public.cases SET status = 'Hacked by User 2' WHERE id = v_test_case_id;
    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    IF v_update_count > 0 THEN
      RAISE WARNING '❌ RLS VIOLATION: User 2 can UPDATE User 1 case! (%rows updated)', v_update_count;
    ELSE
      RAISE NOTICE '✅ UPDATE blocked correctly (0 rows affected)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ UPDATE blocked with error: %', SQLERRM;
  END;
  
  -- Test DELETE  
  RAISE NOTICE 'Testing DELETE...';
  BEGIN
    DELETE FROM public.cases WHERE id = v_test_case_id;
    GET DIAGNOSTICS v_delete_count = ROW_COUNT;
    IF v_delete_count > 0 THEN
      RAISE WARNING '❌ RLS VIOLATION: User 2 can DELETE User 1 case! (% rows deleted)', v_delete_count;
    ELSE
      RAISE NOTICE '✅ DELETE blocked correctly (0 rows affected)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ DELETE blocked with error: %', SQLERRM;
  END;
  
  -- Reset role for cleanup
  RESET ROLE;
  RAISE NOTICE '';
  RAISE NOTICE 'Step 3: Cleanup...';
  DELETE FROM public.cases WHERE id = v_test_case_id;
  RAISE NOTICE '✓ Test case deleted';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST COMPLETE ===';
  
EXCEPTION WHEN OTHERS THEN
  -- Make sure we cleanup even on error
  RESET ROLE;
  DELETE FROM public.cases WHERE id = v_test_case_id;
  RAISE;
END $$;

-- Also check for NULL user_ids that might bypass policies
SELECT 
  'NULL USER_ID CHECK' as check_type,
  COUNT(*) as total_cases,
  COUNT(user_id) as cases_with_user_id,
  COUNT(*) - COUNT(user_id) as cases_without_user_id
FROM public.cases;

-- Check trigger configuration
SELECT 
  'TRIGGER CHECK' as check_type,
  tgname as trigger_name,
  tgtype::text as trigger_type,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.cases'::regclass
  AND tgname LIKE '%user_id%';

-- Verify auth.uid() works in authenticated context
DO $$
DECLARE
  v_auth_uid UUID;
BEGIN
  -- Set a test JWT claim
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, 
    true
  );
  SET LOCAL ROLE authenticated;
  
  BEGIN
    v_auth_uid := auth.uid();
    RAISE NOTICE 'auth.uid() in authenticated context: %', v_auth_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auth.uid() error: %', SQLERRM;
  END;
  
  RESET ROLE;
END $$;