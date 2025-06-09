-- SAFE BACKFILL: Populate user_id columns with proper validation and rollback
-- This migration safely populates user_id columns for existing data
-- with comprehensive logging and rollback capability

-- First, let's check what data needs backfilling
DO $$
DECLARE
  v_orphan_cases INTEGER;
  v_orphan_documents INTEGER;
  v_orphan_contacts INTEGER;
  v_orphan_hearings INTEGER;
  v_orphan_case_contacts INTEGER;
  v_orphan_contact_communications INTEGER;
  v_total_orphans INTEGER;
  v_default_user_id UUID;
  v_first_user_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Count orphaned records
  SELECT COUNT(*) INTO v_orphan_cases FROM cases WHERE user_id IS NULL;
  SELECT COUNT(*) INTO v_orphan_documents FROM documents WHERE user_id IS NULL;
  SELECT COUNT(*) INTO v_orphan_contacts FROM contacts WHERE user_id IS NULL;
  SELECT COUNT(*) INTO v_orphan_hearings FROM hearings WHERE user_id IS NULL;
  
  -- Count optional tables if they exist
  v_orphan_case_contacts := 0;
  v_orphan_contact_communications := 0;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
    SELECT COUNT(*) INTO v_orphan_case_contacts FROM case_contacts WHERE user_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
    SELECT COUNT(*) INTO v_orphan_contact_communications FROM contact_communications WHERE user_id IS NULL;
  END IF;
  
  v_total_orphans := v_orphan_cases + v_orphan_documents + v_orphan_contacts + v_orphan_hearings + v_orphan_case_contacts + v_orphan_contact_communications;
  
  RAISE NOTICE '=== BACKFILL ANALYSIS ===';
  RAISE NOTICE 'Orphaned records found:';
  RAISE NOTICE '- Cases: %', v_orphan_cases;
  RAISE NOTICE '- Documents: %', v_orphan_documents;
  RAISE NOTICE '- Contacts: %', v_orphan_contacts;
  RAISE NOTICE '- Hearings: %', v_orphan_hearings;
  RAISE NOTICE '- Case Contacts: %', v_orphan_case_contacts;
  RAISE NOTICE '- Contact Communications: %', v_orphan_contact_communications;
  RAISE NOTICE 'TOTAL: % records need backfilling', v_total_orphans;
  
  -- Exit early if no orphaned records
  IF v_total_orphans = 0 THEN
    RAISE NOTICE 'No orphaned records found. Backfill not needed.';
    RETURN;
  END IF;
  
  -- Find a suitable default user
  -- First, try to find a user who already owns cases
  SELECT DISTINCT user_id INTO v_default_user_id
  FROM cases 
  WHERE user_id IS NOT NULL 
  ORDER BY user_id
  LIMIT 1;
  
  -- If no user owns cases yet, find the first/admin user
  IF v_default_user_id IS NULL THEN
    -- Look for admin user by email pattern
    SELECT id INTO v_admin_user_id
    FROM auth.users 
    WHERE email ILIKE '%admin%' 
       OR email ILIKE '%@wszllp%'
       OR email = 'czivin@wolfsolovy.com'  -- Known admin email from .env
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Get first user as fallback
    SELECT id INTO v_first_user_id
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Prefer admin user, fall back to first user
    v_default_user_id := COALESCE(v_admin_user_id, v_first_user_id);
  END IF;
  
  IF v_default_user_id IS NULL THEN
    RAISE EXCEPTION 'No suitable user found for backfill. Please ensure at least one user exists in auth.users table.';
  END IF;
  
  -- Show the user that will be used
  RAISE NOTICE '';
  RAISE NOTICE '=== BACKFILL USER SELECTION ===';
  RAISE NOTICE 'Selected user for backfill: %', v_default_user_id;
  
  -- Get user details for confirmation
  DECLARE
    v_user_email TEXT;
    v_user_created TIMESTAMPTZ;
  BEGIN
    SELECT email, created_at INTO v_user_email, v_user_created
    FROM auth.users 
    WHERE id = v_default_user_id;
    
    RAISE NOTICE 'User email: %', v_user_email;
    RAISE NOTICE 'User created: %', v_user_created;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== PROCEEDING WITH BACKFILL ===';
  RAISE NOTICE 'This will assign all orphaned records to user: %', v_default_user_id;
  RAISE NOTICE '';
  
  -- Perform the actual backfill
  BEGIN
    -- Backfill cases
    IF v_orphan_cases > 0 THEN
      UPDATE cases 
      SET user_id = v_default_user_id,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id IS NULL;
      RAISE NOTICE '✓ Updated % cases', v_orphan_cases;
    END IF;
    
    -- Backfill documents (try to inherit from case, fall back to default)
    IF v_orphan_documents > 0 THEN
      UPDATE documents d
      SET user_id = COALESCE(
        (SELECT user_id FROM cases c WHERE c.id = d.case_id),
        v_default_user_id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id IS NULL;
      RAISE NOTICE '✓ Updated % documents', v_orphan_documents;
    END IF;
    
    -- Backfill contacts
    IF v_orphan_contacts > 0 THEN
      UPDATE contacts
      SET user_id = v_default_user_id,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id IS NULL;
      RAISE NOTICE '✓ Updated % contacts', v_orphan_contacts;
    END IF;
    
    -- Backfill hearings (inherit from case)
    IF v_orphan_hearings > 0 THEN
      UPDATE hearings h
      SET user_id = COALESCE(
        (SELECT user_id FROM cases c WHERE c.id = h.case_id),
        v_default_user_id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id IS NULL;
      RAISE NOTICE '✓ Updated % hearings', v_orphan_hearings;
    END IF;
    
    -- Backfill case_contacts if table exists
    IF v_orphan_case_contacts > 0 THEN
      UPDATE case_contacts cc
      SET user_id = COALESCE(
        (SELECT user_id FROM cases c WHERE c.id = cc.case_id),
        v_default_user_id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id IS NULL;
      RAISE NOTICE '✓ Updated % case_contacts', v_orphan_case_contacts;
    END IF;
    
    -- Backfill contact_communications if table exists
    IF v_orphan_contact_communications > 0 THEN
      UPDATE contact_communications cc
      SET user_id = COALESCE(
        (SELECT user_id FROM contacts c WHERE c.id = cc.contact_id),
        v_default_user_id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id IS NULL;
      RAISE NOTICE '✓ Updated % contact_communications', v_orphan_contact_communications;
    END IF;
    
    -- Verify no NULL user_ids remain
    DECLARE
      v_remaining_nulls INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_remaining_nulls FROM cases WHERE user_id IS NULL;
      IF v_remaining_nulls > 0 THEN
        RAISE EXCEPTION 'Cases still have NULL user_id after backfill';
      END IF;
      
      SELECT COUNT(*) INTO v_remaining_nulls FROM documents WHERE user_id IS NULL;
      IF v_remaining_nulls > 0 THEN
        RAISE EXCEPTION 'Documents still have NULL user_id after backfill';
      END IF;
      
      SELECT COUNT(*) INTO v_remaining_nulls FROM contacts WHERE user_id IS NULL;
      IF v_remaining_nulls > 0 THEN
        RAISE EXCEPTION 'Contacts still have NULL user_id after backfill';
      END IF;
      
      SELECT COUNT(*) INTO v_remaining_nulls FROM hearings WHERE user_id IS NULL;
      IF v_remaining_nulls > 0 THEN
        RAISE EXCEPTION 'Hearings still have NULL user_id after backfill';
      END IF;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== BACKFILL COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'All orphaned records have been assigned to user: %', v_default_user_id;
    RAISE NOTICE 'Total records updated: %', v_total_orphans;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '';
      RAISE NOTICE '=== BACKFILL FAILED ===';
      RAISE NOTICE 'Error: %', SQLERRM;
      RAISE NOTICE 'Rolling back all changes...';
      RAISE;
  END;
END $$;

-- Create validation function to check backfill status
CREATE OR REPLACE FUNCTION validate_backfill_status()
RETURNS TABLE(
  table_name text,
  total_records bigint,
  records_with_user_id bigint,
  records_without_user_id bigint,
  backfill_complete boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'cases'::text, 
         COUNT(*)::bigint,
         COUNT(user_id)::bigint,
         COUNT(*) - COUNT(user_id)::bigint,
         COUNT(*) = COUNT(user_id)
  FROM cases
  UNION ALL
  SELECT 'documents'::text,
         COUNT(*)::bigint,
         COUNT(user_id)::bigint,
         COUNT(*) - COUNT(user_id)::bigint,
         COUNT(*) = COUNT(user_id)
  FROM documents
  UNION ALL
  SELECT 'contacts'::text,
         COUNT(*)::bigint,
         COUNT(user_id)::bigint,
         COUNT(*) - COUNT(user_id)::bigint,
         COUNT(*) = COUNT(user_id)
  FROM contacts
  UNION ALL
  SELECT 'hearings'::text,
         COUNT(*)::bigint,
         COUNT(user_id)::bigint,
         COUNT(*) - COUNT(user_id)::bigint,
         COUNT(*) = COUNT(user_id)
  FROM hearings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users for monitoring
GRANT EXECUTE ON FUNCTION validate_backfill_status() TO authenticated;