-- Create hearings table
CREATE TABLE public.hearings (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    court_name TEXT,
    hearing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    participants TEXT[] DEFAULT '{}',
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to see all hearings
CREATE POLICY "Authenticated users can view all hearings" 
ON public.hearings FOR SELECT 
TO authenticated
USING (true);

-- Create policy for authenticated users to insert their own hearings
CREATE POLICY "Authenticated users can insert hearings" 
ON public.hearings FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update their own hearings
CREATE POLICY "Authenticated users can update hearings" 
ON public.hearings FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete their own hearings
CREATE POLICY "Authenticated users can delete hearings" 
ON public.hearings FOR DELETE 
TO authenticated
USING (true);

-- Add function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_hearings_updated_at
BEFORE UPDATE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX hearings_case_id_idx ON public.hearings(case_id);
CREATE INDEX hearings_hearing_date_idx ON public.hearings(hearing_date);