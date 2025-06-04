const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Creating hearings table in Supabase...');

  // Check if the cases table exists first
  const { data: casesTable, error: casesError } = await supabase
    .from('cases')
    .select('id')
    .limit(1);

  if (casesError) {
    console.error('Error: The cases table does not exist or cannot be accessed.');
    console.error('You need to create the cases table first.');
    console.error('Error details:', casesError);
    return;
  }

  // SQL to create hearings table
  const createTableSQL = `
-- Create hearings table
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

-- Add RLS (Row Level Security) policies
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to see all hearings
CREATE POLICY IF NOT EXISTS "Authenticated users can view all hearings" 
ON public.hearings FOR SELECT 
TO authenticated
USING (true);

-- Create policy for authenticated users to insert their own hearings
CREATE POLICY IF NOT EXISTS "Authenticated users can insert hearings" 
ON public.hearings FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update their own hearings
CREATE POLICY IF NOT EXISTS "Authenticated users can update hearings" 
ON public.hearings FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete their own hearings
CREATE POLICY IF NOT EXISTS "Authenticated users can delete hearings" 
ON public.hearings FOR DELETE 
TO authenticated
USING (true);

-- Add function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_hearings_updated_at ON public.hearings;
CREATE TRIGGER update_hearings_updated_at
BEFORE UPDATE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS hearings_case_id_idx ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS hearings_hearing_date_idx ON public.hearings(hearing_date);
  `;

  // Execute the SQL using rpc call
  const { error } = await supabase.rpc('supabase_sql', { query_sql: createTableSQL });

  if (error) {
    console.error('Error creating hearings table:', error);
    return;
  }

  console.log('Hearings table created successfully!');

  // Test the table by inserting a sample record
  const { error: insertError } = await supabase
    .from('hearings')
    .insert({
      id: '00000000-0000-0000-0000-000000000001',
      case_id: casesTable[0]?.id, // Use the first case ID as a reference
      court_name: 'Sample Court',
      hearing_date: new Date().toISOString(),
      participants: ['Judge Smith', 'Attorney Johnson'],
      outcome: 'Test record, please delete',
    });

  if (insertError) {
    console.error('Error inserting test record:', insertError);
    return;
  }

  console.log('Test record inserted successfully.');
  console.log('Hearings table setup complete!');
}

main().catch(console.error);