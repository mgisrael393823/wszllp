-- First, create the cases table
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY,
    plaintiff TEXT NOT NULL,
    defendant TEXT NOT NULL,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'Intake',
    intakeDate TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies for cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to see all cases
CREATE POLICY "Authenticated users can view all cases" 
ON public.cases FOR SELECT 
TO authenticated, anon
USING (true);

-- Create policy for authenticated users to insert cases
CREATE POLICY "Authenticated users can insert cases" 
ON public.cases FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy for authenticated users to update cases
CREATE POLICY "Authenticated users can update cases" 
ON public.cases FOR UPDATE 
TO authenticated, anon
USING (true);

-- Create policy for authenticated users to delete cases
CREATE POLICY "Authenticated users can delete cases" 
ON public.cases FOR DELETE 
TO authenticated, anon
USING (true);

-- Add function to automatically update the updatedAt column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updatedAt timestamp on cases
DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Now create the hearings table that references cases
CREATE TABLE IF NOT EXISTS public.hearings (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    court_name TEXT,
    hearing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    participants TEXT[] DEFAULT '{}',
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies for hearings
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to see all hearings
CREATE POLICY "Authenticated users can view all hearings" 
ON public.hearings FOR SELECT 
TO authenticated, anon
USING (true);

-- Create policy for authenticated users to insert hearings
CREATE POLICY "Authenticated users can insert hearings" 
ON public.hearings FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy for authenticated users to update hearings
CREATE POLICY "Authenticated users can update hearings" 
ON public.hearings FOR UPDATE 
TO authenticated, anon
USING (true);

-- Create policy for authenticated users to delete hearings
CREATE POLICY "Authenticated users can delete hearings" 
ON public.hearings FOR DELETE 
TO authenticated, anon
USING (true);

-- Add trigger to automatically update the updated_at timestamp on hearings
DROP TRIGGER IF EXISTS update_hearings_updated_at ON public.hearings;
CREATE TRIGGER update_hearings_updated_at
BEFORE UPDATE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS hearings_case_id_idx ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS hearings_hearing_date_idx ON public.hearings(hearing_date);