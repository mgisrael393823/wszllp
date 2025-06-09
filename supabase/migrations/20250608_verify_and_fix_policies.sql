-- VERIFY AND FIX POLICIES: Check policy definitions and fix any missing clauses

-- 1. Inspect current policy definitions
DO $$
BEGIN
  RAISE NOTICE '=== INSPECTING CURRENT POLICIES ===';
END $$;

SELECT 
  tablename,
  policyname,
  cmd as command,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
ORDER BY tablename, policyname;

-- 2. Show any policies missing WITH CHECK clauses
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== POLICIES MISSING WITH CHECK ===';
END $$;

SELECT 
  tablename,
  policyname,
  cmd as command,
  'MISSING WITH CHECK' as issue
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
  AND cmd IN ('INSERT', 'UPDATE')
  AND with_check IS NULL;

-- 3. Fix any broken policies
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FIXING BROKEN POLICIES ===';
  
  -- Check each UPDATE policy
  FOR r IN 
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND cmd = 'UPDATE'
      AND (with_check IS NULL OR qual IS NULL)
  LOOP
    RAISE NOTICE 'Fixing UPDATE policy % on %', r.policyname, r.tablename;
    
    -- Drop and recreate with proper clauses
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    
    -- Recreate with both USING and WITH CHECK
    EXECUTE format('
      CREATE POLICY %I
        ON public.%I
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    ', r.policyname, r.tablename);
  END LOOP;
  
  -- Check each DELETE policy
  FOR r IN 
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND cmd = 'DELETE'
      AND qual IS NULL
  LOOP
    RAISE NOTICE 'Fixing DELETE policy % on %', r.policyname, r.tablename;
    
    -- Drop and recreate with proper USING clause
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    
    -- Recreate with USING clause
    EXECUTE format('
      CREATE POLICY %I
        ON public.%I
        FOR DELETE
        TO authenticated
        USING (user_id = auth.uid())
    ', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 4. Fix documents table to prevent cross-case inserts
DROP POLICY IF EXISTS documents_insert_own ON public.documents;

CREATE POLICY "documents_insert_own"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND (
      case_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = case_id 
        AND c.user_id = auth.uid()
      )
    )
  );

-- 5. Manual RLS test
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_test_case_id UUID := gen_random_uuid();
  v_update_count INTEGER;
  v_delete_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MANUAL RLS TEST ===';
  
  -- Get two users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE NOTICE 'Need 2 users for test - skipping';
    RETURN;
  END IF;
  
  -- Create test case as user1
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_case_id, v_user1_id, 'RLS Test', 'RLS Test', 'RLS Test', 'Active');
  
  -- Test UPDATE as user2
  BEGIN
    -- Set context to user2
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user2_id::text)::text, true);
    
    -- Try to update
    UPDATE cases SET status = 'Hacked' WHERE id = v_test_case_id;
    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    
    IF v_update_count > 0 THEN
      RAISE WARNING '❌ RLS FAILURE: User2 updated User1 case!';
    ELSE
      RAISE NOTICE '✅ UPDATE blocked correctly';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ UPDATE blocked with error: %', SQLERRM;
  END;
  
  -- Test DELETE as user2
  BEGIN
    -- Set context to user2
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user2_id::text)::text, true);
    
    -- Try to delete
    DELETE FROM cases WHERE id = v_test_case_id;
    GET DIAGNOSTICS v_delete_count = ROW_COUNT;
    
    IF v_delete_count > 0 THEN
      RAISE WARNING '❌ RLS FAILURE: User2 deleted User1 case!';
    ELSE
      RAISE NOTICE '✅ DELETE blocked correctly';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ DELETE blocked with error: %', SQLERRM;
  END;
  
  -- Cleanup
  DELETE FROM cases WHERE id = v_test_case_id;
  
END $$;

-- 6. Show final policy state
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL POLICY STATE ===';
END $$;

SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN '✓ Has USING'
    ELSE '✗ Missing USING'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL OR cmd NOT IN ('INSERT', 'UPDATE') THEN '✓ OK'
    ELSE '✗ Missing WITH CHECK'
  END as check_status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
ORDER BY tablename, policyname;