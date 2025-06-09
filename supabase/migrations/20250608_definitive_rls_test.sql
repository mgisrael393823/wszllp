-- DEFINITIVE RLS TEST: Pure SQL test to verify RLS at database level

DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_test_case_id UUID := gen_random_uuid();
  v_rows_affected INTEGER;
BEGIN
  RAISE NOTICE '=== DEFINITIVE RLS TEST ===';
  RAISE NOTICE 'Testing RLS purely at the database level';
  RAISE NOTICE '';
  
  -- Get two real users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id ORDER BY created_at LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE EXCEPTION 'Need at least 2 users in auth.users table';
  END IF;
  
  RAISE NOTICE 'User 1 ID: %', v_user1_id;
  RAISE NOTICE 'User 2 ID: %', v_user2_id;
  RAISE NOTICE '';
  
  -- Step 1: Create test case as superuser
  RAISE NOTICE '1. Creating test case as superuser...';
  INSERT INTO public.cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_case_id, v_user1_id, 'RLS Test Case', 'Test Defendant', '123 Test St', 'Active');
  RAISE NOTICE '   ✓ Created case % owned by User 1', v_test_case_id;
  RAISE NOTICE '';
  
  -- Step 2: Switch to User 2 context
  RAISE NOTICE '2. Setting JWT context for User 2...';
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_user2_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
  SET LOCAL ROLE authenticated;
  RAISE NOTICE '   ✓ Switched to authenticated role with User 2 JWT';
  RAISE NOTICE '';
  
  -- Test SELECT
  RAISE NOTICE '3. Testing SELECT as User 2...';
  SELECT COUNT(*) INTO v_rows_affected FROM public.cases WHERE id = v_test_case_id;
  IF v_rows_affected > 0 THEN
    RAISE WARNING '   ❌ FAIL: User 2 CAN SELECT User 1 case!';
  ELSE
    RAISE NOTICE '   ✅ PASS: User 2 cannot SELECT User 1 case';
  END IF;
  
  -- Test UPDATE
  RAISE NOTICE '4. Testing UPDATE as User 2...';
  UPDATE public.cases SET status = 'HACKED' WHERE id = v_test_case_id;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE WARNING '   ❌ FAIL: User 2 CAN UPDATE User 1 case! (% rows)', v_rows_affected;
  ELSE
    RAISE NOTICE '   ✅ PASS: User 2 cannot UPDATE User 1 case (0 rows)';
  END IF;
  
  -- Test DELETE
  RAISE NOTICE '5. Testing DELETE as User 2...';
  DELETE FROM public.cases WHERE id = v_test_case_id;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE WARNING '   ❌ FAIL: User 2 CAN DELETE User 1 case! (% rows)', v_rows_affected;
  ELSE
    RAISE NOTICE '   ✅ PASS: User 2 cannot DELETE User 1 case (0 rows)';
  END IF;
  
  -- Reset and test as owner
  RESET ROLE;
  RAISE NOTICE '';
  RAISE NOTICE '6. Testing as User 1 (owner)...';
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_user1_id::text,
      'role', 'authenticated'
    )::text, 
    true
  );
  SET LOCAL ROLE authenticated;
  
  SELECT COUNT(*) INTO v_rows_affected FROM public.cases WHERE id = v_test_case_id;
  IF v_rows_affected > 0 THEN
    RAISE NOTICE '   ✅ Owner CAN SELECT their own case';
  ELSE
    RAISE WARNING '   ❌ Owner CANNOT SELECT their own case!';
  END IF;
  
  UPDATE public.cases SET status = 'Updated by owner' WHERE id = v_test_case_id;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE NOTICE '   ✅ Owner CAN UPDATE their own case';
  ELSE
    RAISE WARNING '   ❌ Owner CANNOT UPDATE their own case!';
  END IF;
  
  -- Cleanup
  RESET ROLE;
  DELETE FROM public.cases WHERE id = v_test_case_id;
  RAISE NOTICE '';
  RAISE NOTICE '7. Cleanup complete';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST COMPLETE ===';
  
EXCEPTION WHEN OTHERS THEN
  RESET ROLE;
  DELETE FROM public.cases WHERE id = v_test_case_id;
  RAISE;
END $$;

-- Also verify current policies
SELECT 
  'CURRENT POLICIES' as check_type,
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 50) || '...'
    ELSE 'NULL'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 50) || '...'
    ELSE 'NULL'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'cases'
ORDER BY cmd, policyname;

-- Check if auth.uid() works in current context
DO $$
DECLARE
  v_auth_test UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== AUTH FUNCTION TEST ===';
  
  -- Test without JWT
  BEGIN
    v_auth_test := auth.uid();
    RAISE NOTICE 'auth.uid() without JWT: %', COALESCE(v_auth_test::text, 'NULL');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.uid() without JWT: ERROR - %', SQLERRM;
  END;
  
  -- Test with JWT
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, 
    true
  );
  SET LOCAL ROLE authenticated;
  
  BEGIN
    v_auth_test := auth.uid();
    RAISE NOTICE 'auth.uid() with JWT: %', COALESCE(v_auth_test::text, 'NULL');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.uid() with JWT: ERROR - %', SQLERRM;
  END;
  
  RESET ROLE;
END $$;