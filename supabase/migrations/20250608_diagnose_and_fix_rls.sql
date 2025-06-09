-- DIAGNOSE AND FIX RLS: Complete diagnosis and definitive fix

-- 1. First, let's see what policies actually exist
DO $$
BEGIN
  RAISE NOTICE '=== CURRENT POLICIES ON CASES TABLE ===';
END $$;

SELECT 
  policyname, 
  permissive,
  roles::text,
  cmd as operation,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'cases'
ORDER BY policyname;

-- 2. Check RLS status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS STATUS CHECK ===';
END $$;

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings');

-- 3. Check for NULL user_ids
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== NULL USER_ID CHECK ===';
  
  SELECT COUNT(*) INTO v_null_count FROM cases WHERE user_id IS NULL;
  RAISE NOTICE 'Cases with NULL user_id: %', v_null_count;
  
  SELECT COUNT(*) INTO v_null_count FROM documents WHERE user_id IS NULL;
  RAISE NOTICE 'Documents with NULL user_id: %', v_null_count;
  
  SELECT COUNT(*) INTO v_null_count FROM contacts WHERE user_id IS NULL;
  RAISE NOTICE 'Contacts with NULL user_id: %', v_null_count;
  
  SELECT COUNT(*) INTO v_null_count FROM hearings WHERE user_id IS NULL;
  RAISE NOTICE 'Hearings with NULL user_id: %', v_null_count;
END $$;

-- 4. NOW THE FIX: Drop ALL policies and recreate them correctly
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== APPLYING DEFINITIVE RLS FIX ===';
END $$;

-- Drop ALL existing policies on cases
DROP POLICY IF EXISTS "Authenticated users can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can delete cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_select" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_insert" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_update" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_delete" ON public.cases;
DROP POLICY IF EXISTS "strict_cases_select" ON public.cases;
DROP POLICY IF EXISTS "strict_cases_insert" ON public.cases;
DROP POLICY IF EXISTS "strict_cases_update" ON public.cases;
DROP POLICY IF EXISTS "strict_cases_delete" ON public.cases;

-- Create STRICT policies with NO loopholes
CREATE POLICY "cases_select_own_only"
  ON public.cases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "cases_insert_own_only"
  ON public.cases
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cases_update_own_only"
  ON public.cases
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cases_delete_own_only"
  ON public.cases
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Fix the trigger function to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER  -- CRITICAL: Must be DEFINER to access auth.uid()
SET search_path = public
AS $$
BEGIN
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Set ID if not provided
    IF NEW.id IS NULL THEN
      NEW.id := gen_random_uuid();
    END IF;
    
    -- Set user_id if not provided
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
    
    -- CRITICAL: Reject if still no user_id
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot insert record without authenticated user (user_id is NULL)';
    END IF;
    
    -- Set timestamps
    NEW.created_at := COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at := COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
  END IF;
  
  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Prevent changing user_id
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot change user_id of existing record';
    END IF;
    
    -- Update timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Recreate triggers (ensure they're properly attached)
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.cases;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.documents;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.contacts;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.hearings;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- 7. Apply same strict policies to other tables
-- Documents
DROP POLICY IF EXISTS "secure_documents_select" ON public.documents;
DROP POLICY IF EXISTS "secure_documents_insert" ON public.documents;
DROP POLICY IF EXISTS "secure_documents_update" ON public.documents;
DROP POLICY IF EXISTS "secure_documents_delete" ON public.documents;

CREATE POLICY "documents_select_own_only"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "documents_insert_own_only"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update_own_only"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_delete_own_only"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Contacts
DROP POLICY IF EXISTS "secure_contacts_select" ON public.contacts;
DROP POLICY IF EXISTS "secure_contacts_insert" ON public.contacts;
DROP POLICY IF EXISTS "secure_contacts_update" ON public.contacts;
DROP POLICY IF EXISTS "secure_contacts_delete" ON public.contacts;

CREATE POLICY "contacts_select_own_only"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "contacts_insert_own_only"
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contacts_update_own_only"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contacts_delete_own_only"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Hearings
DROP POLICY IF EXISTS "secure_hearings_select" ON public.hearings;
DROP POLICY IF EXISTS "secure_hearings_insert" ON public.hearings;
DROP POLICY IF EXISTS "secure_hearings_update" ON public.hearings;
DROP POLICY IF EXISTS "secure_hearings_delete" ON public.hearings;

CREATE POLICY "hearings_select_own_only"
  ON public.hearings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "hearings_insert_own_only"
  ON public.hearings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "hearings_update_own_only"
  ON public.hearings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "hearings_delete_own_only"
  ON public.hearings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 8. Ensure RLS is ENABLED
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- 9. Final cleanup - ensure NO NULL user_ids remain
UPDATE cases SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) WHERE user_id IS NULL;
UPDATE documents SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) WHERE user_id IS NULL;
UPDATE contacts SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) WHERE user_id IS NULL;
UPDATE hearings SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) WHERE user_id IS NULL;

-- 10. Manual test to verify RLS is working
DO $$
DECLARE
  v_test_case_id UUID;
  v_user1_id UUID;
  v_user2_id UUID;
  v_visible_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MANUAL RLS TEST ===';
  
  -- Get two users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id ORDER BY created_at LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE NOTICE 'Cannot test RLS - need at least 2 users';
    RETURN;
  END IF;
  
  -- Create a test case as user1
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (gen_random_uuid(), v_user1_id, 'Test Plaintiff', 'Test Defendant', 'Test Address', 'Test');
  
  -- Check if user2 can see it (they shouldn't!)
  EXECUTE 'SET LOCAL role TO authenticated';
  EXECUTE format('SET LOCAL request.jwt.claims TO ''{"sub": "%s"}''', v_user2_id);
  
  SELECT COUNT(*) INTO v_visible_count 
  FROM cases 
  WHERE plaintiff = 'Test Plaintiff' 
    AND defendant = 'Test Defendant';
  
  -- Clean up
  DELETE FROM cases WHERE plaintiff = 'Test Plaintiff' AND defendant = 'Test Defendant';
  
  IF v_visible_count > 0 THEN
    RAISE NOTICE '❌ CRITICAL: RLS NOT WORKING! User2 can see User1 cases!';
  ELSE
    RAISE NOTICE '✅ RLS IS WORKING! User2 cannot see User1 cases.';
  END IF;
END $$;

-- 11. Show final status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL POLICY STATUS ===';
END $$;

SELECT 
  tablename,
  policyname,
  cmd as operation,
  permissive,
  roles::text
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
ORDER BY tablename, policyname;

-- 12. Show RLS enabled status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS ENABLED STATUS ===';
END $$;

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
ORDER BY tablename;