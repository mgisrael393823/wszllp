-- Add city, state, and zip_code columns to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Allow email to be nullable for contacts without an email address
ALTER TABLE public.contacts
  ALTER COLUMN email DROP NOT NULL;

-- Update RLS policies to include new columns if needed (no change required)
