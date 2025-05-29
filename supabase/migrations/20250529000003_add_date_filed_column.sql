-- Add dateFiled column to cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS dateFiled TEXT;

-- Add comment to document the field
COMMENT ON COLUMN public.cases.dateFiled IS 'Date the case was filed with the court (MM/DD/YY format)';

-- Create index on dateFiled column for efficient filtering
CREATE INDEX IF NOT EXISTS cases_date_filed_idx ON public.cases(dateFiled);