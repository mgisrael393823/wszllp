-- Phase A Enhanced E-Filing Migration
-- Add payment account, amount in controversy, and case parties support

BEGIN;

-- Add enhanced fields to cases table
ALTER TABLE public.cases
  ADD COLUMN payment_account_id TEXT,
  ADD COLUMN amount_in_controversy DECIMAL(10,2),
  ADD COLUMN show_amount_in_controversy BOOLEAN DEFAULT FALSE;

-- Create case_parties table for petitioner and defendant information
CREATE TABLE public.case_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  party_type TEXT NOT NULL CHECK (party_type IN ('petitioner', 'defendant')),
  is_business BOOLEAN NOT NULL,
  business_name TEXT,
  first_name TEXT,
  last_name TEXT,
  address_line_1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL CHECK (zip_code ~ '^\d{5}(-\d{4})?$')
);

-- Add index for performance
CREATE INDEX idx_case_parties_case_id ON public.case_parties(case_id);

-- Add RLS policies for case_parties
ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all case parties" 
ON public.case_parties FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can insert case parties" 
ON public.case_parties FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Authenticated users can update case parties" 
ON public.case_parties FOR UPDATE 
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can delete case parties" 
ON public.case_parties FOR DELETE 
TO authenticated, anon
USING (true);

COMMIT;