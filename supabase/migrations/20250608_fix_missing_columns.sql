-- FIX MISSING COLUMNS: Add created_at, updated_at, and contact_type columns

-- Add created_at and updated_at to all core tables if missing
DO $$
BEGIN
    -- Cases table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'created_at') THEN
        ALTER TABLE public.cases ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'updated_at') THEN
        ALTER TABLE public.cases ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Documents table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'created_at') THEN
        ALTER TABLE public.documents ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'updated_at') THEN
        ALTER TABLE public.documents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Contacts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'created_at') THEN
        ALTER TABLE public.contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'updated_at') THEN
        ALTER TABLE public.contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    -- Add contact_type to contacts if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'contact_type') THEN
        ALTER TABLE public.contacts ADD COLUMN contact_type TEXT DEFAULT 'Client';
    END IF;

    -- Hearings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hearings' AND column_name = 'created_at') THEN
        ALTER TABLE public.hearings ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hearings' AND column_name = 'updated_at') THEN
        ALTER TABLE public.hearings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Case contacts table (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'case_contacts' AND column_name = 'created_at') THEN
            ALTER TABLE public.case_contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'case_contacts' AND column_name = 'updated_at') THEN
            ALTER TABLE public.case_contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        END IF;
    END IF;

    -- Contact communications table (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'contact_communications' AND column_name = 'created_at') THEN
            ALTER TABLE public.contact_communications ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'contact_communications' AND column_name = 'updated_at') THEN
            ALTER TABLE public.contact_communications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        END IF;
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hearings_updated_at ON hearings;
CREATE TRIGGER update_hearings_updated_at 
    BEFORE UPDATE ON hearings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for optional tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
        DROP TRIGGER IF EXISTS update_case_contacts_updated_at ON case_contacts;
        CREATE TRIGGER update_case_contacts_updated_at 
            BEFORE UPDATE ON case_contacts 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
        DROP TRIGGER IF EXISTS update_contact_communications_updated_at ON contact_communications;
        CREATE TRIGGER update_contact_communications_updated_at 
            BEFORE UPDATE ON contact_communications 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Update the set_user_id function to handle cases where updated_at doesn't exist
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER 
SECURITY INVOKER
AS $$
BEGIN
  -- Only set user_id if it's not already set
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
    
    -- If auth.uid() is null, this is likely a service role operation
    -- Log this for monitoring
    IF NEW.user_id IS NULL THEN
      RAISE WARNING 'user_id is NULL for % operation on % table. This may indicate a service role operation or authentication issue.',
        TG_OP, TG_TABLE_NAME;
    END IF;
  END IF;
  
  -- Set updated_at if the column exists
  IF TG_OP = 'UPDATE' THEN
    BEGIN
      NEW.updated_at := now();
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip
        NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE '=== MISSING COLUMNS FIXED ===';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '✓ created_at and updated_at to all tables';
  RAISE NOTICE '✓ contact_type to contacts table';
  RAISE NOTICE '✓ Automatic updated_at triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables now have proper timestamp tracking.';
END $$;