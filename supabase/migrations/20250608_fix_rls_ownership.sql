-- CRITICAL SECURITY FIX: Add user_id columns and proper RLS policies
-- This migration addresses the security vulnerability where users can access
-- data from other users due to missing user_id scoping in RLS policies

-- Begin transaction for atomic migration
BEGIN;

-- 1. Add user_id columns to core tables (safe - allows NULL initially)
DO $$
BEGIN
    -- Add user_id to cases if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'user_id') THEN
        ALTER TABLE public.cases ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases (user_id);
    END IF;

    -- Add user_id to documents if not exists  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'user_id') THEN
        ALTER TABLE public.documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents (user_id);
    END IF;

    -- Add user_id to contacts if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'user_id') THEN
        ALTER TABLE public.contacts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts (user_id);
    END IF;

    -- CRITICAL: Add user_id to case_parties (SECURITY VULNERABILITY)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_parties' AND column_name = 'user_id') THEN
        ALTER TABLE public.case_parties ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_case_parties_user_id ON public.case_parties (user_id);
    END IF;

    -- Add user_id to hearings if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hearings' AND column_name = 'user_id') THEN
        ALTER TABLE public.hearings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_hearings_user_id ON public.hearings (user_id);
    END IF;
END $$;

-- 2. Drop overly permissive existing policies
-- Cases policies
DROP POLICY IF EXISTS "Authenticated users can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can delete cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON public.cases;

-- Documents policies
DROP POLICY IF EXISTS "Users can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents for their cases" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents for their cases" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents for their cases" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents for their cases" ON public.documents;

-- Contacts policies
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;

-- CRITICAL: case_parties policies (SECURITY FIX)
DROP POLICY IF EXISTS "case_parties_policy" ON public.case_parties;
DROP POLICY IF EXISTS "Users can manage case parties" ON public.case_parties;

-- Hearings policies
DROP POLICY IF EXISTS "Authenticated users can view all hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can insert hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can update hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can delete hearings" ON public.hearings;

-- 3. Create secure RLS policies for cases
CREATE POLICY "secure_cases_select"
  ON public.cases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "secure_cases_insert"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_cases_update"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_cases_delete"
  ON public.cases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Create secure RLS policies for documents
CREATE POLICY "secure_documents_select"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_documents_insert"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (case_id IS NULL OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    ))
  );

CREATE POLICY "secure_documents_update"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id 
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (case_id IS NULL OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    ))
  );

CREATE POLICY "secure_documents_delete"
  ON public.documents FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id 
      AND c.user_id = auth.uid()
    )
  );

-- 5. Create secure RLS policies for contacts
CREATE POLICY "secure_contacts_select"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "secure_contacts_insert"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_contacts_update"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_contacts_delete"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. CRITICAL: Create secure RLS policies for case_parties (SECURITY FIX)
CREATE POLICY "secure_case_parties_select"
  ON public.case_parties FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_parties.case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_case_parties_insert"
  ON public.case_parties FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_case_parties_update"
  ON public.case_parties FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_parties.case_id 
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_case_parties_delete"
  ON public.case_parties FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_parties.case_id 
      AND c.user_id = auth.uid()
    )
  );

-- 7. Create secure RLS policies for hearings
CREATE POLICY "secure_hearings_select"
  ON public.hearings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_hearings_insert"
  ON public.hearings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_hearings_update"
  ON public.hearings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "secure_hearings_delete"
  ON public.hearings FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  );

-- 8. Ensure RLS is enabled on all tables
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- 9. Create helper function to check RLS policy effectiveness
CREATE OR REPLACE FUNCTION check_rls_policy_coverage()
RETURNS TABLE(
  table_name text,
  has_rls boolean,
  policy_count bigint,
  user_id_column_exists boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity as has_rls,
    COALESCE(p.policy_count, 0) as policy_count,
    EXISTS(
      SELECT 1 FROM information_schema.columns c 
      WHERE c.table_name = t.tablename 
      AND c.column_name = 'user_id'
    ) as user_id_column_exists
  FROM pg_tables t
  LEFT JOIN (
    SELECT schemaname, tablename, COUNT(*) as policy_count
    FROM pg_policies 
    GROUP BY schemaname, tablename
  ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
  WHERE t.schemaname = 'public' 
  AND t.tablename IN ('cases', 'documents', 'contacts', 'case_parties', 'hearings')
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users for monitoring
GRANT EXECUTE ON FUNCTION check_rls_policy_coverage() TO authenticated;

COMMIT;

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE 'RLS ownership migration completed successfully';
  RAISE NOTICE 'Next step: Run backfill migration to populate user_id columns';
END $$;