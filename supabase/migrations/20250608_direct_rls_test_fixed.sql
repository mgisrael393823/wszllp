-- DIRECT RLS TEST: Verify RLS is working at the database level

DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_test_case_id UUID := gen_random_uuid();
  v_found_count INTEGER;
  v_update_count INTEGER;
  v_delete_count INTEGER;
BEGIN
  RAISE NOTICE '=== DIRECT DATABASE RLS TEST ===';
  
  -- Get two different users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id ORDER BY created_at LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE NOTICE 'Need at least 2 users to test';
    RETURN;
  END IF;
  
  RAISE NOTICE 'User 1: %', v_user1_id;
  RAISE NOTICE 'User 2: %', v_user2_id;
  RAISE NOTICE '';
  
  -- Create a case as User 1 (using service role initially)
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_case_id, v_user1_id, 'Direct RLS Test', 'Test Defendant', 'Test Address', 'Active');
  
  RAISE NOTICE 'Created test case % owned by User 1', v_test_case_id;
  RAISE NOTICE '';
  
  -- Test 1: Can User 2 SELECT User 1's case?
  RAISE NOTICE 'Test 1: SELECT as User 2...';
  
  -- Set the JWT claims for User 2
  PERFORM set_config('request.jwt.claims', 
    '{"sub": "' || v_user2_id::text || '", "role": "authenticated"}', 
    true);
  SET LOCAL ROLE authenticated;
  
  SELECT COUNT(*) INTO v_found_count FROM cases WHERE id = v_test_case_id;
  
  IF v_found_count > 0 THEN
    RAISE WARNING '❌ SELECT VIOLATION: User 2 can see User 1 case!';
  ELSE
    RAISE NOTICE '✅ SELECT blocked: User 2 cannot see User 1 case';
  END IF;
  
  -- Test 2: Can User 2 UPDATE User 1's case?
  RAISE NOTICE '';
  RAISE NOTICE 'Test 2: UPDATE as User 2...';
  
  BEGIN
    UPDATE cases SET status = 'Hacked' WHERE id = v_test_case_id;
    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    
    IF v_update_count > 0 THEN
      RAISE WARNING '❌ UPDATE VIOLATION: User 2 updated User 1 case!';
    ELSE
      RAISE NOTICE '✅ UPDATE blocked: 0 rows affected';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ UPDATE blocked with error: %', SQLERRM;
  END;
  
  -- Test 3: Can User 2 DELETE User 1's case?
  RAISE NOTICE '';
  RAISE NOTICE 'Test 3: DELETE as User 2...';
  
  BEGIN
    DELETE FROM cases WHERE id = v_test_case_id;
    GET DIAGNOSTICS v_delete_count = ROW_COUNT;
    
    IF v_delete_count > 0 THEN
      RAISE WARNING '❌ DELETE VIOLATION: User 2 deleted User 1 case!';
    ELSE
      RAISE NOTICE '✅ DELETE blocked: 0 rows affected';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ DELETE blocked with error: %', SQLERRM;
  END;
  
  -- Test 4: Can User 1 access their own case?
  RAISE NOTICE '';
  RAISE NOTICE 'Test 4: Operations as User 1 (owner)...';
  RESET ROLE;
  
  -- Set the JWT claims for User 1
  PERFORM set_config('request.jwt.claims', 
    '{"sub": "' || v_user1_id::text || '", "role": "authenticated"}', 
    true);
  SET LOCAL ROLE authenticated;
  
  SELECT COUNT(*) INTO v_found_count FROM cases WHERE id = v_test_case_id;
  IF v_found_count > 0 THEN
    RAISE NOTICE '✅ Owner can SELECT their own case';
  ELSE
    RAISE WARNING '❌ Owner cannot see their own case!';
  END IF;
  
  UPDATE cases SET status = 'Updated by owner' WHERE id = v_test_case_id;
  GET DIAGNOSTICS v_update_count = ROW_COUNT;
  IF v_update_count > 0 THEN
    RAISE NOTICE '✅ Owner can UPDATE their own case';
  ELSE
    RAISE WARNING '❌ Owner cannot update their own case!';
  END IF;
  
  -- Cleanup
  RESET ROLE;
  DELETE FROM cases WHERE id = v_test_case_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST COMPLETE ===';
  
END $$;

-- Also test what happens with direct queries
DO $$
DECLARE
  v_policies_exist BOOLEAN;
  v_rls_enabled BOOLEAN;
  v_auth_uid UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS CONFIGURATION CHECK ===';
  
  -- Check if RLS is enabled
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE oid = 'public.cases'::regclass;
  
  RAISE NOTICE 'RLS enabled on cases table: %', v_rls_enabled;
  
  -- Check if policies exist
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'cases'
  ) INTO v_policies_exist;
  
  RAISE NOTICE 'Policies exist on cases table: %', v_policies_exist;
  
  -- Show auth.uid() function status
  BEGIN
    v_auth_uid := auth.uid();
    RAISE NOTICE 'auth.uid() returns: %', v_auth_uid;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'auth.uid() error: %', SQLERRM;
  END;
  
  -- Check current role
  RAISE NOTICE 'Current role: %', current_user;
  RAISE NOTICE 'Session user: %', session_user;
  
END $$;

-- Test RLS with a simpler approach
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_case_id UUID;
  v_visible BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SIMPLE RLS TEST ===';
  
  -- Get first case and its owner
  SELECT id, user_id INTO v_case_id, v_user1_id 
  FROM cases 
  LIMIT 1;
  
  IF v_case_id IS NULL THEN
    RAISE NOTICE 'No cases found for testing';
    RETURN;
  END IF;
  
  -- Get a different user
  SELECT id INTO v_user2_id 
  FROM auth.users 
  WHERE id != v_user1_id 
  LIMIT 1;
  
  IF v_user2_id IS NULL THEN
    RAISE NOTICE 'Need at least 2 users for testing';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing with case % owned by %', v_case_id, v_user1_id;
  RAISE NOTICE 'Attempting access as user %', v_user2_id;
  
  -- Test as the non-owner
  PERFORM set_config('request.jwt.claims', 
    '{"sub": "' || v_user2_id::text || '", "role": "authenticated"}', 
    true);
  SET LOCAL ROLE authenticated;
  
  -- Can they see it?
  SELECT EXISTS(SELECT 1 FROM cases WHERE id = v_case_id) INTO v_visible;
  
  IF v_visible THEN
    RAISE WARNING '❌ RLS FAILURE: Non-owner can see the case!';
  ELSE
    RAISE NOTICE '✅ RLS SUCCESS: Non-owner cannot see the case';
  END IF;
  
  RESET ROLE;
  
END $$;