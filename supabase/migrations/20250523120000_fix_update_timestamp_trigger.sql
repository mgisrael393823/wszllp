-- Fix update timestamp trigger for cases, hearings, and documents
-- First drop all dependent triggers before dropping the function
DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
DROP TRIGGER IF EXISTS update_hearings_updated_at ON public.hearings;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;

-- Now safely drop the function
DROP FUNCTION IF EXISTS public.update_updated_at_column;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'cases' THEN
        NEW."updatedAt" = now();
    ELSE
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers to use the new function
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hearings_updated_at
BEFORE UPDATE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
