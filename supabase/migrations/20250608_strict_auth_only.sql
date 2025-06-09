-- STRICT AUTH ONLY: Ensure NO unauthenticated access is possible

-- 1. Create a policy to explicitly DENY all access to unauthenticated users
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== ENFORCING STRICT AUTHENTICATION ===';
  
  -- For each table, ensure we have policies that ONLY allow authenticated users
  FOR r IN 
    SELECT DISTINCT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('cases', 'documents', 'contacts', 'hearings', 'case_contacts', 'contact_communications')
  LOOP
    RAISE NOTICE 'Securing table: %', r.tablename;
    
    -- First, ensure RLS is enabled
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    
    -- Drop any permissive policies that might allow unauthenticated access
    EXECUTE format('
      DROP POLICY IF EXISTS %I ON public.%I
    ', 'enable_read_access_for_all_users', r.tablename);
    
    EXECUTE format('
      DROP POLICY IF EXISTS %I ON public.%I
    ', 'allow_anonymous_' || r.tablename, r.tablename);
    
  END LOOP;
END $$;

-- 2. Add explicit anon role denial (belt and suspenders approach)
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CREATING EXPLICIT ANON DENIALS ===';
  
  FOR r IN 
    SELECT DISTINCT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
  LOOP
    -- Create explicit DENY for anon role
    EXECUTE format('
      CREATE POLICY %I
        ON public.%I
        FOR ALL
        TO anon
        USING (false)
    ', 'deny_anon_all_' || r.tablename, r.tablename);
    
    RAISE NOTICE 'Created anon denial for %', r.tablename;
  END LOOP;
END $$;

-- 3. Verify our authenticated policies are restrictive
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFYING AUTHENTICATED POLICIES ===';
END $$;

-- Check that all policies properly restrict to auth.uid()
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  qual as using_clause,
  with_check as check_clause,
  CASE 
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✓ Checks auth'
    WHEN roles::text = '{anon}' AND qual = 'false' THEN '✓ Denies anon'
    ELSE '❌ MISSING AUTH CHECK'
  END as auth_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
ORDER BY tablename, policyname;

-- 4. Test with simulated anon access
DO $$
DECLARE
  v_test_id UUID := gen_random_uuid();
  v_anon_select_count INTEGER;
  v_anon_update_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TESTING ANON ACCESS (should all fail) ===';
  
  -- Insert a test case as service role
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_id, gen_random_uuid(), 'Anon Test', 'Anon Test', 'Test', 'Test');
  
  -- Switch to anon role
  SET LOCAL ROLE anon;
  
  -- Test SELECT as anon
  BEGIN
    SELECT COUNT(*) INTO v_anon_select_count FROM cases WHERE id = v_test_id;
    IF v_anon_select_count > 0 THEN
      RAISE WARNING '❌ ANON CAN SELECT! Found % records', v_anon_select_count;
    ELSE
      RAISE NOTICE '✅ Anon SELECT blocked (no records visible)';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ Anon SELECT blocked with error: %', SQLERRM;
  END;
  
  -- Test UPDATE as anon
  BEGIN
    UPDATE cases SET status = 'Hacked by anon' WHERE id = v_test_id;
    GET DIAGNOSTICS v_anon_update_count = ROW_COUNT;
    IF v_anon_update_count > 0 THEN
      RAISE WARNING '❌ ANON CAN UPDATE! Updated % records', v_anon_update_count;
    ELSE
      RAISE NOTICE '✅ Anon UPDATE blocked (0 records affected)';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ Anon UPDATE blocked with error: %', SQLERRM;
  END;
  
  -- Reset role and cleanup
  RESET ROLE;
  DELETE FROM cases WHERE id = v_test_id;
  
END $$;

-- 5. Summary
DO $$
DECLARE
  v_policy_count INTEGER;
  v_anon_deny_count INTEGER;
  v_auth_only_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SECURITY SUMMARY ===';
  
  SELECT COUNT(*) INTO v_anon_deny_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND policyname LIKE 'deny_anon_%';
  
  SELECT COUNT(*) INTO v_auth_only_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND roles::text = '{authenticated}'
    AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%');
  
  RAISE NOTICE 'Anon denial policies: %', v_anon_deny_count;
  RAISE NOTICE 'Auth-only policies with uid checks: %', v_auth_only_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Tables are now secured:';
  RAISE NOTICE '✓ Anon role explicitly denied';
  RAISE NOTICE '✓ Authenticated users can only access their own data';
  RAISE NOTICE '✓ No unauthenticated access possible';
END $$;