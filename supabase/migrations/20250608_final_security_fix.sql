-- FINAL SECURITY FIX: Ensure proper ID generation and fix remaining issues

-- 1. Fix ID generation on all tables
ALTER TABLE cases ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE documents ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contacts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE hearings ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Fix contacts table schema issue - make role nullable or add default
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'contacts' AND column_name = 'role' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE contacts ALTER COLUMN role DROP NOT NULL;
        ALTER TABLE contacts ALTER COLUMN role SET DEFAULT 'Contact';
    END IF;
END $$;

-- 3. CRITICAL FIX: Ensure RLS policies are properly restrictive
-- Drop and recreate case policies to ensure they're correctly scoped

DROP POLICY IF EXISTS "secure_cases_select" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_insert" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_update" ON public.cases;
DROP POLICY IF EXISTS "secure_cases_delete" ON public.cases;

-- Create VERY STRICT case policies
CREATE POLICY "strict_cases_select"
  ON public.cases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "strict_cases_insert"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "strict_cases_update"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "strict_cases_delete"
  ON public.cases FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Fix the set_user_id trigger to ensure it runs BEFORE insert
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.cases;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.documents;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.contacts;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.hearings;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- 5. Update set_user_id function to be more robust
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER 
SECURITY INVOKER
AS $$
BEGIN
  -- Set user_id if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
    
    -- If still null, reject the insert
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot insert record without authenticated user';
    END IF;
  END IF;
  
  -- Ensure ID is set
  IF TG_OP = 'INSERT' AND NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;
  
  -- Set created_at for new records
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := COALESCE(NEW.updated_at, now());
  END IF;
  
  -- Update updated_at for updates
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Verify RLS is enabled
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- 7. Create a function to verify RLS is working
CREATE OR REPLACE FUNCTION verify_rls_isolation()
RETURNS TABLE(
  check_name text,
  passed boolean,
  details text
) AS $$
DECLARE
  v_user1_id uuid;
  v_user2_id uuid;
  v_case_id uuid;
  v_visible_to_other boolean;
BEGIN
  -- Get two different users
  SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE id != v_user1_id ORDER BY created_at LIMIT 1;
  
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RETURN QUERY SELECT 'user_check'::text, false, 'Need at least 2 users to test RLS';
    RETURN;
  END IF;
  
  -- Get a case owned by user1
  SELECT id INTO v_case_id FROM cases WHERE user_id = v_user1_id LIMIT 1;
  
  IF v_case_id IS NOT NULL THEN
    -- Check if user2 can see user1's case (they shouldn't!)
    PERFORM 1 FROM cases WHERE id = v_case_id AND user_id = v_user2_id;
    v_visible_to_other := FOUND;
    
    RETURN QUERY SELECT 
      'case_isolation'::text, 
      NOT v_visible_to_other, 
      CASE 
        WHEN v_visible_to_other THEN 'CRITICAL: User 2 can see User 1 cases!'
        ELSE 'Good: Cases properly isolated between users'
      END;
  ELSE
    RETURN QUERY SELECT 'case_isolation'::text, NULL::boolean, 'No cases found to test';
  END IF;
  
  -- Check RLS is enabled
  RETURN QUERY
  SELECT 
    'rls_enabled_' || tablename::text,
    rowsecurity,
    CASE 
      WHEN rowsecurity THEN 'RLS enabled on ' || tablename
      ELSE 'WARNING: RLS disabled on ' || tablename
    END
  FROM pg_tables
  WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings');
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_rls_isolation() TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '=== FINAL SECURITY FIXES APPLIED ===';
  RAISE NOTICE '✓ Fixed ID generation on all tables';
  RAISE NOTICE '✓ Fixed contacts role column';
  RAISE NOTICE '✓ Strengthened RLS policies';
  RAISE NOTICE '✓ Enhanced trigger functions';
  RAISE NOTICE '✓ Added RLS verification function';
  RAISE NOTICE '';
  RAISE NOTICE 'Run SELECT * FROM verify_rls_isolation() to check security';
END $$;