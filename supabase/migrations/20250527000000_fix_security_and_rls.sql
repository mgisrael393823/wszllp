-- Fix SECURITY DEFINER views and enhance RLS policies
-- This migration addresses security linting issues with SECURITY DEFINER functions
-- and tightens RLS policies to remove overly permissive anonymous access

-- 1. Fix SECURITY DEFINER function to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER 
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add user_id column to core tables if not exists (safe to run multiple times)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create indexes for user-based queries
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents (user_id);
CREATE INDEX IF NOT EXISTS idx_hearings_user_id ON public.hearings (user_id);

-- 4. Drop overly permissive anonymous policies on critical tables
DROP POLICY IF EXISTS "Authenticated users can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can delete cases" ON public.cases;

DROP POLICY IF EXISTS "Users can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents" ON public.documents;

DROP POLICY IF EXISTS "Authenticated users can view all hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can insert hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can update hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can delete hearings" ON public.hearings;

-- Remove all anonymous access policies for production security
DROP POLICY IF EXISTS "Anonymous can view all contacts (dev only)" ON public.contacts;
DROP POLICY IF EXISTS "Anonymous can insert contacts (dev only)" ON public.contacts;
DROP POLICY IF EXISTS "Anonymous can update contacts (dev only)" ON public.contacts;
DROP POLICY IF EXISTS "Anonymous can delete contacts (dev only)" ON public.contacts;
DROP POLICY IF EXISTS "Anonymous can manage case contacts (dev only)" ON public.case_contacts;
DROP POLICY IF EXISTS "Anonymous can manage communications (dev only)" ON public.contact_communications;

-- 5. Create secure RLS policies for cases
CREATE POLICY "Users can view their own cases"
  ON public.cases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
  ON public.cases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Create secure RLS policies for documents
CREATE POLICY "Users can view documents for their cases"
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

CREATE POLICY "Users can insert documents for their cases"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for their cases"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their cases"
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

-- 7. Create secure RLS policies for hearings
CREATE POLICY "Users can view hearings for their cases"
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

CREATE POLICY "Users can insert hearings for their cases"
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

CREATE POLICY "Users can update hearings for their cases"
  ON public.hearings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete hearings for their cases"
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

-- 8. Add triggers to automatically set user_id on insert for new tables
DROP TRIGGER IF EXISTS set_cases_user_id ON public.cases;
CREATE TRIGGER set_cases_user_id
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_documents_user_id ON public.documents;
CREATE TRIGGER set_documents_user_id
  BEFORE INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_hearings_user_id ON public.hearings;
CREATE TRIGGER set_hearings_user_id
  BEFORE INSERT ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- 9. Add comments for documentation
COMMENT ON FUNCTION public.set_user_id() IS 'Automatically sets user_id to the current authenticated user on insert - now SECURITY INVOKER for better security';
COMMENT ON POLICY "Users can view their own cases" ON public.cases IS 'Users can only view cases they own - no anonymous access';
COMMENT ON POLICY "Users can view documents for their cases" ON public.documents IS 'Users can view documents they own or for cases they own';
COMMENT ON POLICY "Users can view hearings for their cases" ON public.hearings IS 'Users can view hearings they own or for cases they own';