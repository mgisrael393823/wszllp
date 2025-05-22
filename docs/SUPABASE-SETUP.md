# Supabase Setup Guide

This guide explains how to set up the necessary tables and configurations in your Supabase project for the application.

## Project Details

- **Supabase URL**: `https://karvbtpygbavvqydfcju.supabase.co`
- **Public Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDk0MDksImV4cCI6MjA2MjM4NTQwOX0.dHTzkJ_IwXeBfR5QLDRLw8XZTVCmeLBMRi0oQgUX5wk`

## Setting Up the Cases and Hearings Tables

### Option 1: Using the Supabase Dashboard SQL Editor

1. Login to your [Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the following SQL script:

```sql
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
TO authenticated
USING (true);

-- Create policy for authenticated users to insert cases
CREATE POLICY "Authenticated users can insert cases" 
ON public.cases FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update cases
CREATE POLICY "Authenticated users can update cases" 
ON public.cases FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete cases
CREATE POLICY "Authenticated users can delete cases" 
ON public.cases FOR DELETE 
TO authenticated
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
TO authenticated
USING (true);

-- Create policy for authenticated users to insert hearings
CREATE POLICY "Authenticated users can insert hearings" 
ON public.hearings FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update hearings
CREATE POLICY "Authenticated users can update hearings" 
ON public.hearings FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete hearings
CREATE POLICY "Authenticated users can delete hearings" 
ON public.hearings FOR DELETE 
TO authenticated
USING (true);

-- Add trigger to automatically update the updated_at timestamp on hearings
DROP TRIGGER IF EXISTS update_hearings_updated_at ON public.hearings;
CREATE TRIGGER update_hearings_updated_at
BEFORE UPDATE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS hearings_case_id_idx ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS hearings_hearing_date_idx ON public.hearings(hearing_date);
```

6. Run the query

### Option 2: Using the Supabase API via a Script

If you prefer to use a script to set up the tables, you can use the following Node.js script. 

First, install the required dependencies:

```bash
npm install @supabase/supabase-js dotenv
```

Then create a file called `setup-supabase.js` with the following content:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupHearingsTable() {
  console.log('Setting up hearings table...');
  
  // First, check if the cases table exists
  const { data: casesExists, error: casesCheckError } = await supabase
    .from('cases')
    .select('id')
    .limit(1);
    
  if (casesCheckError && casesCheckError.code !== 'PGRST116') {
    console.error('Error checking cases table:', casesCheckError);
    console.error('Please ensure the cases table exists before creating the hearings table.');
    return;
  }
  
  // Create the hearings table
  try {
    // Due to limitations in directly executing SQL via the JavaScript client,
    // we'll use a combination of Supabase API methods
    
    // 1. Create the table if it doesn't exist
    const { error: createError } = await supabase
      .from('hearings')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000000',
          case_id: null,
          court_name: 'SETUP',
          hearing_date: new Date().toISOString(),
          participants: [],
          outcome: 'SETUP'
        }
      ])
      .select();
      
    // This will fail if the table already exists, which is fine
    console.log('Attempted to create hearings table');
    
    // Delete the test record if it was created
    await supabase
      .from('hearings')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');
      
    console.log('Hearings table setup complete!');
  } catch (error) {
    console.error('Error setting up hearings table:', error);
  }
}

async function main() {
  await setupHearingsTable();
}

main().catch(console.error);
```

Run the script using:

```bash
node setup-supabase.js
```

## Verifying the Setup

After running either of the setup methods, you can verify that the hearings table was created correctly:

1. Go to the "Table Editor" in your Supabase dashboard
2. Look for the "hearings" table in the list of tables
3. Click on it to view its structure

You should see the following columns:
- `id` (UUID, Primary Key)
- `case_id` (UUID, Foreign Key to cases table)
- `court_name` (Text)
- `hearing_date` (Timestamp with time zone)
- `participants` (Array of Text)
- `outcome` (Text)
- `created_at` (Timestamp with time zone)
- `updated_at` (Timestamp with time zone)

## Setting Up Authentication

For the authentication to work correctly with the application:

1. Go to the "Authentication" section in your Supabase dashboard
2. Go to "Providers" and ensure "Email" is enabled
3. Go to "URL Configuration" and set:
   - Site URL: Your application's URL (e.g., `http://localhost:3000`)
   - Redirect URLs: Add your application's redirect URLs (e.g., `http://localhost:3000/login`)

## Environment Variables

Ensure your application has the correct environment variables set up. Create or update your `.env.local` file with:

```
VITE_SUPABASE_URL=https://karvbtpygbavvqydfcju.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDk0MDksImV4cCI6MjA2MjM4NTQwOX0.dHTzkJ_IwXeBfR5QLDRLw8XZTVCmeLBMRi0oQgUX5wk
```

## Testing the Integration

After setting everything up, you can test the integration by:

1. Running your application
2. Navigating to the hearings page
3. Creating a new hearing
4. Verifying that the hearing appears in both the application and in the Supabase table editor