-- FIX DELETE POLICY: Add WITH CHECK clause for completeness

-- First, let's see the current DELETE policies
DO $$
BEGIN
  RAISE NOTICE '=== FIXING DELETE POLICIES ===';
  RAISE NOTICE 'DELETE operations should have both USING and WITH CHECK clauses';
  RAISE NOTICE 'for maximum security, even though WITH CHECK is technically';
  RAISE NOTICE 'not used for DELETE operations in PostgreSQL.';
END $$;

-- Drop and recreate DELETE policies with both clauses for consistency
-- This ensures the policy definition is complete and clear

-- Cases
DROP POLICY IF EXISTS cases_delete_own ON public.cases;
CREATE POLICY cases_delete_own ON public.cases
  FOR DELETE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Documents  
DROP POLICY IF EXISTS documents_delete_own ON public.documents;
CREATE POLICY documents_delete_own ON public.documents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Contacts
DROP POLICY IF EXISTS contacts_delete_own ON public.contacts;
CREATE POLICY contacts_delete_own ON public.contacts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Hearings
DROP POLICY IF EXISTS hearings_delete_own ON public.hearings;
CREATE POLICY hearings_delete_own ON public.hearings
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  );

-- Verify the policies
SELECT 
  'UPDATED POLICIES' as status,
  tablename,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- Now run a quick test
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_test_case_id UUID := gen_random_uuid();
  v_delete_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== QUICK DELETE POLICY TEST ===';
  
  -- Get two users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id LIMIT 1;
  
  IF v_user2_id IS NULL THEN
    RAISE NOTICE 'Need 2 users for test - skipping';
    RETURN;
  END IF;
  
  -- Create test case
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_case_id, v_user1_id, 'Delete Test', 'Test', 'Test', 'Active');
  
  -- Try to delete as wrong user
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_user2_id::text, 'role', 'authenticated')::text, 
    true);
  SET LOCAL ROLE authenticated;
  
  DELETE FROM cases WHERE id = v_test_case_id;
  GET DIAGNOSTICS v_delete_count = ROW_COUNT;
  
  IF v_delete_count > 0 THEN
    RAISE WARNING '❌ User 2 DELETED User 1 case!';
  ELSE
    RAISE NOTICE '✅ User 2 blocked from deleting User 1 case';
  END IF;
  
  -- Cleanup
  RESET ROLE;
  DELETE FROM cases WHERE id = v_test_case_id;
  
END $$;