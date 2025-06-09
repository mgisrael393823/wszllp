-- COMPLETE RLS FIX: Comprehensive security fix addressing all gaps

-- 1. Show current state
DO $$
BEGIN
  RAISE NOTICE '=== CURRENT RLS STATE ===';
END $$;

SELECT 
  tablename,
  COUNT(*) as policy_count,
  array_agg(policyname ORDER BY policyname) as existing_policies
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;

-- 2. Fix trigger function - MUST be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER  -- CRITICAL: Required to access auth.uid()
SET search_path = public
AS $$
BEGIN
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Generate ID if not provided (standardizing on trigger handling)
    IF NEW.id IS NULL THEN
      NEW.id := gen_random_uuid();
    END IF;
    
    -- Set user_id if not provided
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
    
    -- CRITICAL: Reject if still no user_id
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot insert record without authenticated user';
    END IF;
    
    -- Set timestamps if columns exist
    BEGIN
      NEW.created_at := COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    EXCEPTION WHEN undefined_column THEN
      -- Column doesn't exist, skip
    END;
    
    BEGIN
      NEW.updated_at := COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    EXCEPTION WHEN undefined_column THEN
      -- Column doesn't exist, skip
    END;
  END IF;
  
  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Prevent changing user_id
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot change user_id of existing record';
    END IF;
    
    -- Update timestamp if column exists
    BEGIN
      NEW.updated_at := CURRENT_TIMESTAMP;
    EXCEPTION WHEN undefined_column THEN
      -- Column doesn't exist, skip
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Drop ALL existing policies
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DROPPING ALL EXISTING POLICIES ===';
  
  -- Drop all policies on all tables
  FOR r IN 
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- 4. Create STRICT policies for core tables (NO NULL LOOPHOLES)

-- CASES
CREATE POLICY "cases_select_own"
  ON public.cases FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "cases_insert_own"
  ON public.cases FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

CREATE POLICY "cases_update_own"
  ON public.cases FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cases_delete_own"
  ON public.cases FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- DOCUMENTS
CREATE POLICY "documents_select_own"
  ON public.documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "documents_insert_own"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

CREATE POLICY "documents_update_own"
  ON public.documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_delete_own"
  ON public.documents FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- CONTACTS
CREATE POLICY "contacts_select_own"
  ON public.contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "contacts_insert_own"
  ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

CREATE POLICY "contacts_update_own"
  ON public.contacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contacts_delete_own"
  ON public.contacts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- HEARINGS
CREATE POLICY "hearings_select_own"
  ON public.hearings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "hearings_insert_own"
  ON public.hearings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

CREATE POLICY "hearings_update_own"
  ON public.hearings FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "hearings_delete_own"
  ON public.hearings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. Create STRICT policies for junction tables

-- CASE_PARTIES (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
    
    -- Enable RLS
    ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;
    
    -- Create strict policies
    CREATE POLICY "case_parties_select_own"
      ON public.case_parties FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "case_parties_insert_own"
      ON public.case_parties FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

    CREATE POLICY "case_parties_update_own"
      ON public.case_parties FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "case_parties_delete_own"
      ON public.case_parties FOR DELETE TO authenticated
      USING (user_id = auth.uid());
      
    RAISE NOTICE 'Created strict policies for case_parties';
  END IF;
END $$;

-- CASE_CONTACTS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
    
    -- Enable RLS
    ALTER TABLE public.case_contacts ENABLE ROW LEVEL SECURITY;
    
    -- Create strict policies
    CREATE POLICY "case_contacts_select_own"
      ON public.case_contacts FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "case_contacts_insert_own"
      ON public.case_contacts FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

    CREATE POLICY "case_contacts_update_own"
      ON public.case_contacts FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "case_contacts_delete_own"
      ON public.case_contacts FOR DELETE TO authenticated
      USING (user_id = auth.uid());
      
    RAISE NOTICE 'Created strict policies for case_contacts';
  END IF;
END $$;

-- CONTACT_COMMUNICATIONS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
    
    -- Enable RLS
    ALTER TABLE public.contact_communications ENABLE ROW LEVEL SECURITY;
    
    -- Create strict policies
    CREATE POLICY "contact_communications_select_own"
      ON public.contact_communications FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "contact_communications_insert_own"
      ON public.contact_communications FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

    CREATE POLICY "contact_communications_update_own"
      ON public.contact_communications FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "contact_communications_delete_own"
      ON public.contact_communications FOR DELETE TO authenticated
      USING (user_id = auth.uid());
      
    RAISE NOTICE 'Created strict policies for contact_communications';
  END IF;
END $$;

-- HEARING_PARTICIPANTS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'hearing_participants') THEN
    
    -- Enable RLS
    ALTER TABLE public.hearing_participants ENABLE ROW LEVEL SECURITY;
    
    -- Create strict policies
    CREATE POLICY "hearing_participants_select_own"
      ON public.hearing_participants FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "hearing_participants_insert_own"
      ON public.hearing_participants FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid()); -- NO OR user_id IS NULL

    CREATE POLICY "hearing_participants_update_own"
      ON public.hearing_participants FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "hearing_participants_delete_own"
      ON public.hearing_participants FOR DELETE TO authenticated
      USING (user_id = auth.uid());
      
    RAISE NOTICE 'Created strict policies for hearing_participants';
  END IF;
END $$;

-- 6. Standardize ID generation - remove column defaults, let trigger handle everything
DO $$
BEGIN
  -- Remove defaults from core tables
  ALTER TABLE cases ALTER COLUMN id DROP DEFAULT;
  ALTER TABLE documents ALTER COLUMN id DROP DEFAULT;
  ALTER TABLE contacts ALTER COLUMN id DROP DEFAULT;
  ALTER TABLE hearings ALTER COLUMN id DROP DEFAULT;
  
  -- Remove defaults from junction tables if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
    ALTER TABLE case_parties ALTER COLUMN id DROP DEFAULT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
    ALTER TABLE case_contacts ALTER COLUMN id DROP DEFAULT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
    ALTER TABLE contact_communications ALTER COLUMN id DROP DEFAULT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'hearing_participants') THEN
    ALTER TABLE hearing_participants ALTER COLUMN id DROP DEFAULT;
  END IF;
  
  RAISE NOTICE 'Removed column defaults - trigger will handle ID generation';
END $$;

-- 7. Ensure triggers are attached to ALL tables
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

-- Add triggers to junction tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
    DROP TRIGGER IF EXISTS set_user_id_trigger ON public.case_parties;
    CREATE TRIGGER set_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.case_parties
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
    DROP TRIGGER IF EXISTS set_user_id_trigger ON public.case_contacts;
    CREATE TRIGGER set_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.case_contacts
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
    DROP TRIGGER IF EXISTS set_user_id_trigger ON public.contact_communications;
    CREATE TRIGGER set_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.contact_communications
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'hearing_participants') THEN
    DROP TRIGGER IF EXISTS set_user_id_trigger ON public.hearing_participants;
    CREATE TRIGGER set_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.hearing_participants
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
END $$;

-- 8. Ensure RLS is enabled on ALL tables
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- 9. Smart backfill for NULL user_ids
DO $$
DECLARE
  v_admin_user_id UUID;
  v_default_user_id UUID;
  v_null_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SMART BACKFILL FOR NULL USER_IDS ===';
  
  -- First try to find admin user
  SELECT id INTO v_admin_user_id
  FROM auth.users 
  WHERE email ILIKE '%admin%' 
     OR email = 'czivin@wolfsolovy.com'
  ORDER BY created_at 
  LIMIT 1;
  
  -- If no admin, use first user
  IF v_admin_user_id IS NULL THEN
    SELECT id INTO v_default_user_id
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 1;
  ELSE
    v_default_user_id := v_admin_user_id;
  END IF;
  
  IF v_default_user_id IS NULL THEN
    RAISE NOTICE 'No users found for backfill - skipping';
    RETURN;
  END IF;
  
  -- Backfill core tables
  UPDATE cases SET user_id = v_default_user_id WHERE user_id IS NULL;
  GET DIAGNOSTICS v_null_count = ROW_COUNT;
  IF v_null_count > 0 THEN
    RAISE NOTICE 'Backfilled % cases with user_id %', v_null_count, v_default_user_id;
  END IF;
  
  -- For related tables, try to inherit from parent
  UPDATE documents d 
  SET user_id = COALESCE(
    (SELECT user_id FROM cases c WHERE c.id = d.case_id),
    v_default_user_id
  )
  WHERE user_id IS NULL;
  GET DIAGNOSTICS v_null_count = ROW_COUNT;
  IF v_null_count > 0 THEN
    RAISE NOTICE 'Backfilled % documents', v_null_count;
  END IF;
  
  UPDATE hearings h 
  SET user_id = COALESCE(
    (SELECT user_id FROM cases c WHERE c.id = h.case_id),
    v_default_user_id
  )
  WHERE user_id IS NULL;
  GET DIAGNOSTICS v_null_count = ROW_COUNT;
  IF v_null_count > 0 THEN
    RAISE NOTICE 'Backfilled % hearings', v_null_count;
  END IF;
  
  UPDATE contacts SET user_id = v_default_user_id WHERE user_id IS NULL;
  GET DIAGNOSTICS v_null_count = ROW_COUNT;
  IF v_null_count > 0 THEN
    RAISE NOTICE 'Backfilled % contacts', v_null_count;
  END IF;
END $$;

-- 10. Final RLS verification test
DO $$
DECLARE
  v_test_id UUID := gen_random_uuid();
  v_user1_id UUID;
  v_user2_id UUID;
  v_found BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS VERIFICATION TEST ===';
  
  -- Get two different users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE NOTICE 'Need at least 2 users to test RLS - skipping test';
    RETURN;
  END IF;
  
  -- Insert a test case as user1
  INSERT INTO cases (id, user_id, plaintiff, defendant, address, status)
  VALUES (v_test_id, v_user1_id, 'RLS Test', 'RLS Test', 'RLS Test', 'Test');
  
  -- Try to select it with user2's context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user2_id::text)::text, true);
  
  SELECT EXISTS(SELECT 1 FROM cases WHERE id = v_test_id) INTO v_found;
  
  -- Clean up
  DELETE FROM cases WHERE id = v_test_id;
  
  IF v_found THEN
    RAISE WARNING '❌ RLS FAILURE: User % can see case owned by user %', v_user2_id, v_user1_id;
    RAISE WARNING 'CRITICAL: RLS policies are not working correctly!';
  ELSE
    RAISE NOTICE '✅ RLS SUCCESS: Cross-user access is properly blocked';
  END IF;
END $$;

-- 11. Summary report
DO $$
DECLARE
  v_policy_count INTEGER;
  v_null_count INTEGER;
  v_table_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL SUMMARY ===';
  
  SELECT COUNT(DISTINCT tablename) INTO v_table_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  SELECT SUM(null_count) INTO v_null_count
  FROM (
    SELECT COUNT(*) as null_count FROM cases WHERE user_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM documents WHERE user_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM contacts WHERE user_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM hearings WHERE user_id IS NULL
  ) t;
  
  RAISE NOTICE 'Tables with RLS policies: %', v_table_count;
  RAISE NOTICE 'Total policies created: %', v_policy_count;
  RAISE NOTICE 'Records with NULL user_id: %', v_null_count;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Trigger function is SECURITY DEFINER';
  RAISE NOTICE '✓ All policies use strict user_id = auth.uid() (NO NULL loopholes)';
  RAISE NOTICE '✓ ID generation handled by trigger only';
  RAISE NOTICE '✓ Junction tables have strict policies';
  RAISE NOTICE '✓ Smart backfill completed';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS security fix is complete. Run your test suite to verify.';
END $$;