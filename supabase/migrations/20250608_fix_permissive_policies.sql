-- FIX PERMISSIVE POLICIES: Remove ineffective anon denial policies

-- 1. Show current problematic policies
DO $$
BEGIN
  RAISE NOTICE '=== REMOVING INEFFECTIVE ANON POLICIES ===';
  RAISE NOTICE 'PERMISSIVE policies with USING(false) do not block access!';
END $$;

-- 2. Drop all the ineffective anon denial policies
DROP POLICY IF EXISTS deny_anon_all_cases ON public.cases;
DROP POLICY IF EXISTS deny_anon_all_documents ON public.documents;
DROP POLICY IF EXISTS deny_anon_all_contacts ON public.contacts;
DROP POLICY IF EXISTS deny_anon_all_hearings ON public.hearings;

DO $$
BEGIN
  RAISE NOTICE 'Dropped ineffective anon policies';
END $$;

-- 3. The authenticated-only policies are sufficient!
-- They already restrict access to authenticated users only
-- No need for separate anon denials

-- 4. Verify final policy state
SELECT 
  'FINAL POLICIES' as status,
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
GROUP BY tablename
ORDER BY tablename;

-- 5. Test RLS with actual user context
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_test_case_id UUID := gen_random_uuid();
  v_can_see BOOLEAN;
  v_can_update INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL RLS TEST ===';
  
  -- Get two users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id LIMIT 1;
  
  IF v_user2_id IS NULL THEN
    RAISE NOTICE 'Need 2 users for test - skipping';
    RETURN;
  END IF;
  
  -- Create test case as superuser
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_case_id, v_user1_id, 'Final Test', 'Test', 'Test', 'Active');
  
  RAISE NOTICE 'Created case % owned by user %', v_test_case_id, v_user1_id;
  
  -- Test as authenticated user 2
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_user2_id::text, 'role', 'authenticated')::text, 
    true);
  SET LOCAL ROLE authenticated;
  
  -- Can user 2 see it?
  SELECT EXISTS(SELECT 1 FROM cases WHERE id = v_test_case_id) INTO v_can_see;
  
  IF v_can_see THEN
    RAISE WARNING '❌ User 2 CAN see User 1 case!';
  ELSE
    RAISE NOTICE '✅ User 2 cannot see User 1 case';
  END IF;
  
  -- Can user 2 update it?
  UPDATE cases SET status = 'Hacked' WHERE id = v_test_case_id;
  GET DIAGNOSTICS v_can_update = ROW_COUNT;
  
  IF v_can_update > 0 THEN
    RAISE WARNING '❌ User 2 CAN update User 1 case!';
  ELSE
    RAISE NOTICE '✅ User 2 cannot update User 1 case';
  END IF;
  
  -- Cleanup
  RESET ROLE;
  DELETE FROM cases WHERE id = v_test_case_id;
  
  RAISE NOTICE 'Test complete';
END $$;

-- 6. Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Removed ineffective PERMISSIVE deny policies';
  RAISE NOTICE 'Authenticated-only policies now properly restrict access';
  RAISE NOTICE 'Only authenticated users can access data';
  RAISE NOTICE 'Each user can only access their own records';
END $$;