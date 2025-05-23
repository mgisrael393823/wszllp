-- Create the documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Complaint', 'Summons', 'Affidavit', 'Motion', 'Order', 'Other')),
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Served', 'Failed')),
    service_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see all documents
CREATE POLICY "Users can view all documents" 
ON public.documents FOR SELECT 
TO authenticated, anon
USING (true);

-- Create policy for users to insert documents
CREATE POLICY "Users can insert documents" 
ON public.documents FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy for users to update documents
CREATE POLICY "Users can update documents" 
ON public.documents FOR UPDATE 
TO authenticated, anon
USING (true);

-- Create policy for users to delete documents
CREATE POLICY "Users can delete documents" 
ON public.documents FOR DELETE 
TO authenticated, anon
USING (true);

-- Add trigger to automatically update the updated_at timestamp on documents
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS documents_case_id_idx ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS documents_type_idx ON public.documents(type);
CREATE INDEX IF NOT EXISTS documents_status_idx ON public.documents(status);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents(created_at);