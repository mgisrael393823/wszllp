-- Enhanced RLS Policies for Multi-User Security
-- This migration replaces the basic policies with user-specific access control

-- Drop existing basic policies
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;

DROP POLICY IF EXISTS "Users can view all case contacts" ON public.case_contacts;
DROP POLICY IF EXISTS "Users can insert case contacts" ON public.case_contacts;
DROP POLICY IF EXISTS "Users can update case contacts" ON public.case_contacts;
DROP POLICY IF EXISTS "Users can delete case contacts" ON public.case_contacts;

-- Add user_id column to tables for ownership tracking
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.case_contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contact_communications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user-based queries
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_case_contacts_user_id ON public.case_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_communications_user_id ON public.contact_communications (user_id);

-- Enhanced RLS Policies for Contacts
CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing contacts linked to cases the user has access to
    EXISTS (
      SELECT 1 FROM public.case_contacts cc
      JOIN public.cases c ON cc.case_id = c.id
      WHERE cc.contact_id = contacts.id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enhanced RLS Policies for Case Contacts
CREATE POLICY "Users can view case contacts for their cases"
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

CREATE POLICY "Users can insert case contacts for their cases"
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

CREATE POLICY "Users can update case contacts for their cases"
  ON public.case_contacts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete case contacts for their cases"
  ON public.case_contacts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id 
      AND c.user_id = auth.uid()
    )
  );

-- Enhanced RLS Policies for Contact Communications
CREATE POLICY "Users can view communications for their contacts"
  ON public.contact_communications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_communications.contact_id 
      AND c.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.cases ca
      WHERE ca.id = contact_communications.case_id 
      AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert communications for their contacts"
  ON public.contact_communications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE c.id = contact_id 
        AND c.user_id = auth.uid()
      ) OR
      (case_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.cases ca
        WHERE ca.id = case_id 
        AND ca.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can update their own communications"
  ON public.contact_communications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own communications"
  ON public.contact_communications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to automatically set user_id
CREATE TRIGGER set_contacts_user_id
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_case_contacts_user_id
  BEFORE INSERT ON public.case_contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_contact_communications_user_id
  BEFORE INSERT ON public.contact_communications
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Anonymous access policies (for development/testing only)
CREATE POLICY "Anonymous can view all contacts (dev only)"
  ON public.contacts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can insert contacts (dev only)"
  ON public.contacts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous can update contacts (dev only)"
  ON public.contacts FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anonymous can delete contacts (dev only)"
  ON public.contacts FOR DELETE
  TO anon
  USING (true);

-- Similar anonymous policies for other tables (remove in production)
CREATE POLICY "Anonymous can manage case contacts (dev only)"
  ON public.case_contacts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous can manage communications (dev only)"
  ON public.contact_communications FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON POLICY "Users can view shared contacts" ON public.contacts IS 'Allows viewing contacts that are linked to cases the user has access to';
COMMENT ON FUNCTION set_user_id() IS 'Automatically sets user_id to the current authenticated user on insert';
COMMENT ON POLICY "Anonymous can view all contacts (dev only)" ON public.contacts IS 'Development only - remove in production';