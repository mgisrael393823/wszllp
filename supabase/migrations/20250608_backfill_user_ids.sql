-- SAFE BACKFILL: Populate user_id columns with proper validation and rollback
-- This migration safely populates user_id columns for existing data
-- with comprehensive logging and rollback capability

-- Set configuration for default user (can be overridden)
-- Usage: SET app.default_migration_user_id = 'uuid-here'; before running migration

DO $$
DECLARE
  v_orphan_cases INTEGER;
  v_orphan_documents INTEGER;
  v_orphan_contacts INTEGER;
  v_orphan_case_parties INTEGER;
  v_orphan_hearings INTEGER;
  v_default_user_id UUID;
  v_cases_before INTEGER;
  v_cases_after INTEGER;
  v_documents_before INTEGER;
  v_documents_after INTEGER;
  v_contacts_before INTEGER;
  v_contacts_after INTEGER;
  v_case_parties_before INTEGER;
  v_case_parties_after INTEGER;
  v_hearings_before INTEGER;
  v_hearings_after INTEGER;
  v_first_user_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Start transaction with savepoint for rollback capability
  SAVEPOINT backfill_start;
  
  BEGIN
    RAISE NOTICE 'Starting safe backfill of user_id columns...';
    
    -- Count orphaned records before backfill
    SELECT COUNT(*) INTO v_orphan_cases FROM cases WHERE user_id IS NULL;
    SELECT COUNT(*) INTO v_orphan_documents FROM documents WHERE user_id IS NULL;
    SELECT COUNT(*) INTO v_orphan_contacts FROM contacts WHERE user_id IS NULL;
    SELECT COUNT(*) INTO v_orphan_case_parties FROM case_parties WHERE user_id IS NULL;
    SELECT COUNT(*) INTO v_orphan_hearings FROM hearings WHERE user_id IS NULL;
    
    RAISE NOTICE 'Orphaned records found:';
    RAISE NOTICE '- Cases: %', v_orphan_cases;
    RAISE NOTICE '- Documents: %', v_orphan_documents;
    RAISE NOTICE '- Contacts: %', v_orphan_contacts;
    RAISE NOTICE '- Case Parties: %', v_orphan_case_parties;
    RAISE NOTICE '- Hearings: %', v_hearings;
    
    -- Exit early if no orphaned records
    IF v_orphan_cases = 0 AND v_orphan_documents = 0 AND v_orphan_contacts = 0 
       AND v_orphan_case_parties = 0 AND v_orphan_hearings = 0 THEN
      RAISE NOTICE 'No orphaned records found. Backfill not needed.';
      RETURN;
    END IF;
    
    -- Get default user from configuration or find suitable user
    BEGIN
      v_default_user_id := current_setting('app.default_migration_user_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        v_default_user_id := NULL;
    END;
    
    -- If no configured user, try to find from existing data
    IF v_default_user_id IS NULL THEN
      -- Try to find a user who already owns cases
      SELECT DISTINCT user_id INTO v_default_user_id
      FROM cases 
      WHERE user_id IS NOT NULL 
      LIMIT 1;
      
      -- If still no user, try to find first user in auth.users
      IF v_default_user_id IS NULL THEN
        SELECT id INTO v_first_user_id
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Look for admin user by email pattern
        SELECT id INTO v_admin_user_id
        FROM auth.users 
        WHERE email ILIKE '%admin%' OR email ILIKE '%@wszllp%'
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Prefer admin user, fall back to first user
        v_default_user_id := COALESCE(v_admin_user_id, v_first_user_id);
      END IF;
      
      IF v_default_user_id IS NULL THEN
        RAISE EXCEPTION 'No suitable default user found. Please set app.default_migration_user_id or ensure at least one user exists in auth.users';
      END IF;
    END IF;
    
    RAISE NOTICE 'Using default user ID: %', v_default_user_id;
    
    -- Verify the user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_default_user_id) THEN
      RAISE EXCEPTION 'Default user % does not exist in auth.users', v_default_user_id;
    END IF;
    
    -- Count records before backfill for validation
    SELECT COUNT(*) INTO v_cases_before FROM cases;
    SELECT COUNT(*) INTO v_documents_before FROM documents;
    SELECT COUNT(*) INTO v_contacts_before FROM contacts;
    SELECT COUNT(*) INTO v_case_parties_before FROM case_parties;
    SELECT COUNT(*) INTO v_hearings_before FROM hearings;
    
    RAISE NOTICE 'Record counts before backfill:';
    RAISE NOTICE '- Cases: %', v_cases_before;
    RAISE NOTICE '- Documents: %', v_documents_before;
    RAISE NOTICE '- Contacts: %', v_contacts_before;
    RAISE NOTICE '- Case Parties: %', v_case_parties_before;
    RAISE NOTICE '- Hearings: %', v_hearings_before;
    
    -- Perform backfill operations
    RAISE NOTICE 'Starting backfill operations...';
    
    -- Backfill cases
    UPDATE cases 
    SET user_id = v_default_user_id 
    WHERE user_id IS NULL;
    
    -- Backfill documents (try to inherit from case, fall back to default)
    UPDATE documents d
    SET user_id = COALESCE(
      (SELECT user_id FROM cases c WHERE c.id = d.case_id),
      v_default_user_id
    )
    WHERE user_id IS NULL;
    
    -- Backfill contacts
    UPDATE contacts
    SET user_id = v_default_user_id
    WHERE user_id IS NULL;
    
    -- Backfill case_parties (inherit from case)
    UPDATE case_parties cp
    SET user_id = COALESCE(
      (SELECT user_id FROM cases c WHERE c.id = cp.case_id),
      v_default_user_id
    )
    WHERE user_id IS NULL;
    
    -- Backfill hearings (inherit from case)
    UPDATE hearings h
    SET user_id = COALESCE(
      (SELECT user_id FROM cases c WHERE c.id = h.case_id),
      v_default_user_id
    )
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Backfill operations completed';
    
    -- Count records after backfill for validation
    SELECT COUNT(*) INTO v_cases_after FROM cases;
    SELECT COUNT(*) INTO v_documents_after FROM documents;
    SELECT COUNT(*) INTO v_contacts_after FROM contacts;
    SELECT COUNT(*) INTO v_case_parties_after FROM case_parties;
    SELECT COUNT(*) INTO v_hearings_after FROM hearings;
    
    RAISE NOTICE 'Record counts after backfill:';
    RAISE NOTICE '- Cases: %', v_cases_after;
    RAISE NOTICE '- Documents: %', v_documents_after;
    RAISE NOTICE '- Contacts: %', v_contacts_after;
    RAISE NOTICE '- Case Parties: %', v_case_parties_after;
    RAISE NOTICE '- Hearings: %', v_hearings_after;
    
    -- Validate record counts match (no data loss)
    IF v_cases_before != v_cases_after THEN
      RAISE EXCEPTION 'Cases count mismatch! Before: %, After: %', v_cases_before, v_cases_after;
    END IF;
    
    IF v_documents_before != v_documents_after THEN
      RAISE EXCEPTION 'Documents count mismatch! Before: %, After: %', v_documents_before, v_documents_after;
    END IF;
    
    IF v_contacts_before != v_contacts_after THEN
      RAISE EXCEPTION 'Contacts count mismatch! Before: %, After: %', v_contacts_before, v_contacts_after;
    END IF;
    
    IF v_case_parties_before != v_case_parties_after THEN
      RAISE EXCEPTION 'Case parties count mismatch! Before: %, After: %', v_case_parties_before, v_case_parties_after;
    END IF;
    
    IF v_hearings_before != v_hearings_after THEN
      RAISE EXCEPTION 'Hearings count mismatch! Before: %, After: %', v_hearings_before, v_hearings_after;
    END IF;
    
    -- Verify no NULL user_id values remain
    IF EXISTS (SELECT 1 FROM cases WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'Cases still have NULL user_id after backfill';
    END IF;
    
    IF EXISTS (SELECT 1 FROM documents WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'Documents still have NULL user_id after backfill';
    END IF;
    
    IF EXISTS (SELECT 1 FROM contacts WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'Contacts still have NULL user_id after backfill';
    END IF;
    
    IF EXISTS (SELECT 1 FROM case_parties WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'Case parties still have NULL user_id after backfill';
    END IF;
    
    IF EXISTS (SELECT 1 FROM hearings WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'Hearings still have NULL user_id after backfill';
    END IF;
    
    -- Log successful completion
    RAISE NOTICE 'Backfill completed successfully!';
    RAISE NOTICE 'All records now have user_id set to: %', v_default_user_id;
    RAISE NOTICE 'Total records processed:';
    RAISE NOTICE '- Cases: %', v_orphan_cases;
    RAISE NOTICE '- Documents: %', v_orphan_documents;
    RAISE NOTICE '- Contacts: %', v_orphan_contacts;
    RAISE NOTICE '- Case Parties: %', v_orphan_case_parties;
    RAISE NOTICE '- Hearings: %', v_orphan_hearings;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback to savepoint on any error
      ROLLBACK TO SAVEPOINT backfill_start;
      RAISE NOTICE 'Backfill failed and rolled back: %', SQLERRM;
      RAISE NOTICE 'No data was modified due to the error';
      RAISE; -- Re-raise the exception
  END;
END $$;

-- Create function to manually set default user and re-run backfill if needed
CREATE OR REPLACE FUNCTION run_backfill_with_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Set the configuration for this session
  PERFORM set_config('app.default_migration_user_id', target_user_id::text, false);
  
  -- Re-run the backfill logic (simplified version)
  UPDATE cases SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE documents d SET user_id = COALESCE(
    (SELECT user_id FROM cases c WHERE c.id = d.case_id),
    target_user_id
  ) WHERE user_id IS NULL;
  UPDATE contacts SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE case_parties cp SET user_id = COALESCE(
    (SELECT user_id FROM cases c WHERE c.id = cp.case_id),
    target_user_id
  ) WHERE user_id IS NULL;
  UPDATE hearings h SET user_id = COALESCE(
    (SELECT user_id FROM cases c WHERE c.id = h.case_id),
    target_user_id
  ) WHERE user_id IS NULL;
  
  RAISE NOTICE 'Manual backfill completed for user: %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users for emergency backfill
GRANT EXECUTE ON FUNCTION run_backfill_with_user(UUID) TO authenticated;

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
  SELECT 'case_parties'::text,
         COUNT(*)::bigint,
         COUNT(user_id)::bigint,
         COUNT(*) - COUNT(user_id)::bigint,
         COUNT(*) = COUNT(user_id)
  FROM case_parties
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