-- Migration: Add e-filing tracking columns to documents table
-- This migration adds tracking columns for Tyler Technologies e-filing integration
-- Wrapped in transaction for rollback safety

BEGIN;

-- Add e-filing tracking columns to documents table
-- Using nullable columns to avoid breaking existing records
ALTER TABLE public.documents 
ADD COLUMN envelope_id TEXT,  -- Tyler envelope ID for e-filing tracking
ADD COLUMN filing_id TEXT,    -- Tyler individual filing ID
ADD COLUMN efile_status TEXT, -- E-filing specific status from Tyler API
ADD COLUMN efile_timestamp TIMESTAMP WITH TIME ZONE; -- When e-filing was submitted

-- Add indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS documents_envelope_id_idx ON public.documents(envelope_id);
CREATE INDEX IF NOT EXISTS documents_filing_id_idx ON public.documents(filing_id);
CREATE INDEX IF NOT EXISTS documents_efile_status_idx ON public.documents(efile_status);
CREATE INDEX IF NOT EXISTS documents_efile_timestamp_idx ON public.documents(efile_timestamp);

-- Add comments for documentation
COMMENT ON COLUMN public.documents.envelope_id IS 'Tyler Technologies envelope ID for e-filing tracking';
COMMENT ON COLUMN public.documents.filing_id IS 'Tyler Technologies individual filing ID';
COMMENT ON COLUMN public.documents.efile_status IS 'E-filing specific status from Tyler API (submitted, accepted, rejected, etc.)';
COMMENT ON COLUMN public.documents.efile_timestamp IS 'Timestamp when document was submitted via e-filing';

-- Create partial unique index to prevent duplicate e-filings (only when envelope_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS documents_envelope_filing_unique_idx 
ON public.documents(envelope_id, filing_id) 
WHERE envelope_id IS NOT NULL AND filing_id IS NOT NULL;

COMMIT;