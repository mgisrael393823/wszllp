-- Create sandbox environment for demo purposes
-- This migration sets up isolated demo data for evictionsandbox@gmail.com

-- Create sandbox tables (matching frontend schema)
CREATE TABLE IF NOT EXISTS sandbox_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  caseId TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  plaintiff TEXT NOT NULL,
  defendant TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'Intake',
  intakeDate TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
  createdAt TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  updatedAt TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE IF NOT EXISTS sandbox_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_type TEXT DEFAULT 'client',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sandbox_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  case_id UUID REFERENCES sandbox_cases(id),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  original_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sandbox_hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  case_id UUID REFERENCES sandbox_cases(id),
  title TEXT NOT NULL,
  description TEXT,
  hearing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  hearing_type TEXT DEFAULT 'eviction_hearing',
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check if user is sandbox user
CREATE OR REPLACE FUNCTION is_sandbox_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' = 'evictionsandbox@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for existing tables to block sandbox user
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;

-- RLS policies for production tables (block sandbox user)
DROP POLICY IF EXISTS "Users can only access their own cases" ON cases;
CREATE POLICY "Users can only access their own cases" ON cases
  FOR ALL USING (
    user_id = auth.uid() AND NOT is_sandbox_user()
  );

DROP POLICY IF EXISTS "Users can only access their own contacts" ON contacts;
CREATE POLICY "Users can only access their own contacts" ON contacts
  FOR ALL USING (
    user_id = auth.uid() AND NOT is_sandbox_user()
  );

DROP POLICY IF EXISTS "Users can only access their own documents" ON documents;
CREATE POLICY "Users can only access their own documents" ON documents
  FOR ALL USING (
    user_id = auth.uid() AND NOT is_sandbox_user()
  );

DROP POLICY IF EXISTS "Users can only access their own hearings" ON hearings;
CREATE POLICY "Users can only access their own hearings" ON hearings
  FOR ALL USING (
    user_id = auth.uid() AND NOT is_sandbox_user()
  );

-- RLS policies for sandbox tables (only sandbox user)
ALTER TABLE sandbox_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_hearings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only sandbox user can access sandbox cases" ON sandbox_cases
  FOR ALL USING (is_sandbox_user());

CREATE POLICY "Only sandbox user can access sandbox contacts" ON sandbox_contacts
  FOR ALL USING (is_sandbox_user());

CREATE POLICY "Only sandbox user can access sandbox documents" ON sandbox_documents
  FOR ALL USING (is_sandbox_user());

CREATE POLICY "Only sandbox user can access sandbox hearings" ON sandbox_hearings
  FOR ALL USING (is_sandbox_user());

-- Insert realistic demo data for sandbox
-- Note: user_id will be set when the sandbox user is created
INSERT INTO sandbox_cases (
  title, description, case_number, status, case_type, court_jurisdiction, 
  filing_date, hearing_date, client_name, client_email, client_phone, 
  property_address, rent_amount, past_due_amount, notes
) VALUES 
(
  'Eviction - 123 Main Street Apartment 2B',
  'Non-payment of rent for 3 months. Tenant has not responded to notices.',
  'CV2024-001234',
  'active',
  'eviction',
  'Cook County Circuit Court',
  '2024-05-15',
  '2024-06-15 09:00:00',
  'John Smith',
  'john.smith.demo@email.com',
  '(555) 123-4567',
  '123 Main Street, Apt 2B, Chicago, IL 60601',
  1500.00,
  4500.00,
  'Tenant has been responsive to initial contact but missed payment deadlines.'
),
(
  'Commercial Lease Dispute - ABC Store',
  'Tenant disputing lease terms and requesting rent reduction.',
  'CV2024-001235',
  'pending',
  'commercial_dispute',
  'Cook County Circuit Court',
  '2024-05-10',
  '2024-06-20 14:00:00',
  'ABC Store Inc.',
  'legal@abcstore-demo.com',
  '(555) 987-6543',
  '456 Commerce Street, Chicago, IL 60602',
  3500.00,
  0.00,
  'Commercial tenant citing business impact from nearby construction.'
),
(
  'Eviction - 789 Oak Avenue Unit 5',
  'Lease violation - unauthorized pets and subletting.',
  'CV2024-001236',
  'filed',
  'eviction',
  'Cook County Circuit Court',
  '2024-05-20',
  '2024-06-25 10:30:00',
  'Sarah Johnson',
  'sarah.johnson.demo@email.com',
  '(555) 555-0123',
  '789 Oak Avenue, Unit 5, Chicago, IL 60603',
  1200.00,
  1200.00,
  'Multiple lease violations documented. Tenant has been uncooperative.'
);

INSERT INTO sandbox_contacts (
  name, email, phone, address, contact_type, notes
) VALUES 
(
  'John Smith',
  'john.smith.demo@email.com',
  '(555) 123-4567',
  '123 Main Street, Apt 2B, Chicago, IL 60601',
  'tenant',
  'Responsive tenant, financial hardship due to job loss.'
),
(
  'ABC Store Inc.',
  'legal@abcstore-demo.com',
  '(555) 987-6543',
  '456 Commerce Street, Chicago, IL 60602',
  'tenant',
  'Commercial tenant, been in good standing for 3 years until recent dispute.'
),
(
  'Sarah Johnson',
  'sarah.johnson.demo@email.com',
  '(555) 555-0123',
  '789 Oak Avenue, Unit 5, Chicago, IL 60603',
  'tenant',
  'Problematic tenant with multiple violations. Consider for eviction.'
),
(
  'Property Management Partners',
  'contact@pmp-demo.com',
  '(555) 111-2222',
  '100 Property Lane, Chicago, IL 60604',
  'property_manager',
  'Reliable property management company handling multiple properties.'
),
(
  'Cook County Sheriff Department',
  'evictions@sheriff-demo.gov',
  '(555) 311-9999',
  '69 W Washington St, Chicago, IL 60602',
  'court_official',
  'Primary contact for eviction enforcement and service of process.'
);

INSERT INTO sandbox_hearings (
  case_id, title, description, hearing_date, location, hearing_type, status, notes
) VALUES 
(
  (SELECT id FROM sandbox_cases WHERE case_number = 'CV2024-001234'),
  'Eviction Hearing - 123 Main Street',
  'Initial hearing for non-payment eviction case',
  '2024-06-15 09:00:00',
  'Cook County Circuit Court - Room 302',
  'eviction_hearing',
  'scheduled',
  'Tenant has right to appear and contest. Bring all payment records.'
),
(
  (SELECT id FROM sandbox_cases WHERE case_number = 'CV2024-001235'),
  'Commercial Dispute Mediation',
  'Court-ordered mediation for lease dispute resolution',
  '2024-06-20 14:00:00',
  'Cook County Circuit Court - Mediation Room A',
  'mediation',
  'scheduled',
  'Both parties required to attend. Bring lease agreement and financial records.'
),
(
  (SELECT id FROM sandbox_cases WHERE case_number = 'CV2024-001236'),
  'Eviction Hearing - 789 Oak Avenue',
  'Hearing for lease violation eviction case',
  '2024-06-25 10:30:00',
  'Cook County Circuit Court - Room 205',
  'eviction_hearing',
  'scheduled',
  'Evidence of lease violations documented. Photos and witness statements ready.'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sandbox_cases_user_id ON sandbox_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_contacts_user_id ON sandbox_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_documents_user_id ON sandbox_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_documents_case_id ON sandbox_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_hearings_user_id ON sandbox_hearings(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_hearings_case_id ON sandbox_hearings(case_id);

-- Grant permissions
GRANT ALL ON sandbox_cases TO authenticated;
GRANT ALL ON sandbox_contacts TO authenticated;
GRANT ALL ON sandbox_documents TO authenticated;
GRANT ALL ON sandbox_hearings TO authenticated;