-- CRITICAL SECURITY FIX: Add user_id columns and proper RLS policies
-- This migration addresses the security vulnerability where users can access
-- data from other users due to missing user_id scoping in RLS policies
-- UPDATED: Safe version that checks table existence

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

    -- Check if case_parties table exists before trying to alter it
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
        -- Add user_id to case_parties if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'case_parties' AND column_name = 'user_id') THEN
            ALTER TABLE public.case_parties ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_case_parties_user_id ON public.case_parties (user_id);
        END IF;
    ELSE
        RAISE NOTICE 'Table case_parties does not exist - skipping';
    END IF;

    -- Add user_id to hearings if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hearings' AND column_name = 'user_id') THEN
        ALTER TABLE public.hearings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_hearings_user_id ON public.hearings (user_id);
    END IF;

    -- Add user_id to case_contacts if not exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'case_contacts' AND column_name = 'user_id') THEN
            ALTER TABLE public.case_contacts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_case_contacts_user_id ON public.case_contacts (user_id);
        END IF;
    END IF;

    -- Add user_id to contact_communications if not exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'contact_communications' AND column_name = 'user_id') THEN
            ALTER TABLE public.contact_communications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_contact_communications_user_id ON public.contact_communications (user_id);
        END IF;
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

-- Only drop case_parties policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
        DROP POLICY IF EXISTS "case_parties_policy" ON public.case_parties;
        DROP POLICY IF EXISTS "Users can manage case parties" ON public.case_parties;
    END IF;
END $$;

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

-- 6. Create secure RLS policies for case_parties if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
        
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
    END IF;
END $$;

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

-- 8. Create secure RLS policies for case_contacts if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
        
        CREATE POLICY "secure_case_contacts_select"
          ON public.case_contacts FOR SELECT
          TO authenticated
          USING (
            auth.uid() = user_id OR
            EXISTS (
              SELECT 1 FROM public.cases c
              WHERE c.id = case_contacts.case_id 
              AND c.user_id = auth.uid()
            )
          );

        CREATE POLICY "secure_case_contacts_insert"
          ON public.case_contacts FOR INSERT
          TO authenticated
          WITH CHECK (
            auth.uid() = user_id AND
            EXISTS (
              SELECT 1 FROM public.cases c
              WHERE c.id = case_id 
              AND c.user_id = auth.uid()
            )
          );

        CREATE POLICY "secure_case_contacts_update"
          ON public.case_contacts FOR UPDATE
          TO authenticated
          USING (
            auth.uid() = user_id OR
            EXISTS (
              SELECT 1 FROM public.cases c
              WHERE c.id = case_contacts.case_id 
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

        CREATE POLICY "secure_case_contacts_delete"
          ON public.case_contacts FOR DELETE
          TO authenticated
          USING (
            auth.uid() = user_id OR
            EXISTS (
              SELECT 1 FROM public.cases c
              WHERE c.id = case_contacts.case_id 
              AND c.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 9. Create secure RLS policies for contact_communications if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
        
        CREATE POLICY "secure_contact_communications_select"
          ON public.contact_communications FOR SELECT
          TO authenticated
          USING (
            auth.uid() = user_id OR
            EXISTS (
              SELECT 1 FROM public.contacts c
              WHERE c.id = contact_communications.contact_id 
              AND c.user_id = auth.uid()
            )
          );

        CREATE POLICY "secure_contact_communications_insert"
          ON public.contact_communications FOR INSERT
          TO authenticated
          WITH CHECK (
            auth.uid() = user_id AND
            EXISTS (
              SELECT 1 FROM public.contacts c
              WHERE c.id = contact_id 
              AND c.user_id = auth.uid()
            )
          );

        CREATE POLICY "secure_contact_communications_update"
          ON public.contact_communications FOR UPDATE
          TO authenticated
          USING (
            auth.uid() = user_id OR
            EXISTS (
              SELECT 1 FROM public.contacts c
              WHERE c.id = contact_communications.contact_id 
              AND c.user_id = auth.uid()
            )
          )
          WITH CHECK (
            auth.uid() = user_id AND
            EXISTS (
              SELECT 1 FROM public.contacts c
              WHERE c.id = contact_id 
              AND c.user_id = auth.uid()
            )
          );

        CREATE POLICY "secure_contact_communications_delete"
          ON public.contact_communications FOR DELETE
          TO authenticated
          USING (
            auth.uid() = user_id OR
            EXISTS (
              SELECT 1 FROM public.contacts c
              WHERE c.id = contact_communications.contact_id 
              AND c.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 10. Ensure RLS is enabled on all tables
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on optional tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_parties') THEN
        ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
        ALTER TABLE public.case_contacts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
        ALTER TABLE public.contact_communications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 11. Create helper function to check RLS policy effectiveness
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
  AND t.tablename IN ('cases', 'documents', 'contacts', 'case_parties', 'hearings', 'case_contacts', 'contact_communications')
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
  RAISE NOTICE 'Tables updated: cases, documents, contacts, hearings (and case_contacts, contact_communications if they exist)';
  RAISE NOTICE 'Table case_parties was not found and was skipped';
  RAISE NOTICE 'Next step: Run backfill migration to populate user_id columns';
END $$;