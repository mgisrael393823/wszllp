-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  role TEXT NOT NULL CHECK (role IN ('Attorney', 'Paralegal', 'PM', 'Client', 'Other')),
  email TEXT NOT NULL CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_contacts_name ON public.contacts (name);
CREATE INDEX idx_contacts_role ON public.contacts (role);
CREATE INDEX idx_contacts_email ON public.contacts (email);
CREATE INDEX idx_contacts_created_at ON public.contacts (created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view all contacts"
  ON public.contacts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON public.contacts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update contacts"
  ON public.contacts FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can delete contacts"
  ON public.contacts FOR DELETE
  TO authenticated, anon
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();