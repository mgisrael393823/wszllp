-- Create case_contacts junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.case_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'Plaintiff', 
    'Defendant', 
    'Attorney', 
    'Paralegal', 
    'Property Manager', 
    'Witness', 
    'Expert', 
    'Court Reporter',
    'Other'
  )),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique case-contact-relationship combination
  UNIQUE(case_id, contact_id, relationship_type)
);

-- Create indexes for efficient queries
CREATE INDEX idx_case_contacts_case_id ON public.case_contacts (case_id);
CREATE INDEX idx_case_contacts_contact_id ON public.case_contacts (contact_id);
CREATE INDEX idx_case_contacts_relationship ON public.case_contacts (relationship_type);
CREATE INDEX idx_case_contacts_primary ON public.case_contacts (is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.case_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for case_contacts
CREATE POLICY "Users can view all case contacts"
  ON public.case_contacts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert case contacts"
  ON public.case_contacts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update case contacts"
  ON public.case_contacts FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can delete case contacts"
  ON public.case_contacts FOR DELETE
  TO authenticated, anon
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_case_contacts_updated_at
  BEFORE UPDATE ON public.case_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.case_contacts IS 'Junction table linking cases to contacts with relationship types';
COMMENT ON COLUMN public.case_contacts.relationship_type IS 'Defines the role of the contact in this specific case';
COMMENT ON COLUMN public.case_contacts.is_primary IS 'Marks the primary contact for this relationship type in the case';