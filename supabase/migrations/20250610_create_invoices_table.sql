-- Create invoices table for billing and payment tracking
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id TEXT UNIQUE NOT NULL DEFAULT ('INV-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid BOOLEAN NOT NULL DEFAULT false,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'credit_card', 'wire_transfer', 'other', NULL)),
    payment_reference TEXT,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Create policy for users to insert their own invoices
CREATE POLICY "Users can insert their own invoices" 
ON public.invoices FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy for users to update their own invoices
CREATE POLICY "Users can update their own invoices" 
ON public.invoices FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Create policy for users to delete their own invoices
CREATE POLICY "Users can delete their own invoices" 
ON public.invoices FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Add trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to set user_id on insert if not provided
CREATE TRIGGER set_invoices_user_id
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS invoices_case_id_idx ON public.invoices(case_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_paid_idx ON public.invoices(paid);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON public.invoices(issue_date);

-- Add comment to document the table
COMMENT ON TABLE public.invoices IS 'Stores invoice and billing information for cases';
COMMENT ON COLUMN public.invoices.invoice_id IS 'Human-readable invoice number';
COMMENT ON COLUMN public.invoices.payment_reference IS 'Check number, transaction ID, or other payment reference';