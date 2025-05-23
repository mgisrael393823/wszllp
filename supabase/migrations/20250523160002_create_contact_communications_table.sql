-- Create contact_communications table for tracking interactions
CREATE TABLE IF NOT EXISTS public.contact_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN (
    'Email', 
    'Phone Call', 
    'Meeting', 
    'Letter', 
    'Text Message',
    'Video Call',
    'Other'
  )),
  subject TEXT,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Incoming', 'Outgoing')),
  communication_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_by TEXT, -- Future: user ID who logged this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contact_communications_contact_id ON public.contact_communications (contact_id);
CREATE INDEX idx_contact_communications_case_id ON public.contact_communications (case_id);
CREATE INDEX idx_contact_communications_date ON public.contact_communications (communication_date);
CREATE INDEX idx_contact_communications_type ON public.contact_communications (communication_type);
CREATE INDEX idx_contact_communications_follow_up ON public.contact_communications (follow_up_required, follow_up_date) WHERE follow_up_required = true;

-- Enable RLS
ALTER TABLE public.contact_communications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all contact communications"
  ON public.contact_communications FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert contact communications"
  ON public.contact_communications FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update contact communications"
  ON public.contact_communications FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can delete contact communications"
  ON public.contact_communications FOR DELETE
  TO authenticated, anon
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_communications_updated_at
  BEFORE UPDATE ON public.contact_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.contact_communications IS 'Log of all communications with contacts';
COMMENT ON COLUMN public.contact_communications.direction IS 'Whether communication was incoming (to us) or outgoing (from us)';
COMMENT ON COLUMN public.contact_communications.case_id IS 'Optional case context for the communication';