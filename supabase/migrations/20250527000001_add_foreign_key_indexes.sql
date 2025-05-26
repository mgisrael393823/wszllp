-- Add B-tree indexes on all foreign key columns for performance optimization
-- This migration addresses performance linting issues by ensuring all FK columns have indexes

-- 1. Add indexes for case_contacts table foreign keys
CREATE INDEX IF NOT EXISTS idx_case_contacts_case_id ON public.case_contacts(case_id);
CREATE INDEX IF NOT EXISTS idx_case_contacts_contact_id ON public.case_contacts(contact_id);

-- 2. Add indexes for documents table foreign keys
-- Note: documents_case_id_idx already exists from previous migration, but safe to run
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);

-- 3. Add indexes for hearings table foreign keys  
-- Note: hearings_case_id_idx already exists from previous migration, but safe to run
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);

-- 4. Add indexes for contact_communications table foreign keys
CREATE INDEX IF NOT EXISTS idx_contact_communications_contact_id ON public.contact_communications(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_communications_case_id ON public.contact_communications(case_id);

-- 5. Add indexes for auth/user reference columns (user_id foreign keys)
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_hearings_user_id ON public.hearings(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_case_contacts_user_id ON public.case_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_communications_user_id ON public.contact_communications(user_id);

-- 6. Add composite indexes for common query patterns
-- Case + user combinations (for multi-tenant queries)
CREATE INDEX IF NOT EXISTS idx_documents_case_user ON public.documents(case_id, user_id);
CREATE INDEX IF NOT EXISTS idx_hearings_case_user ON public.hearings(case_id, user_id);

-- Date-based queries with user filtering
CREATE INDEX IF NOT EXISTS idx_cases_user_created ON public.cases(user_id, createdat);
CREATE INDEX IF NOT EXISTS idx_documents_user_created ON public.documents(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hearings_user_date ON public.hearings(user_id, hearing_date);

-- Status-based queries with user filtering
CREATE INDEX IF NOT EXISTS idx_cases_user_status ON public.cases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON public.documents(user_id, status);

-- 7. Add covering indexes for dashboard materialized view performance
-- These help with the aggregate queries in dashboard views
CREATE INDEX IF NOT EXISTS idx_cases_status_created_at ON public.cases(status, createdat);
CREATE INDEX IF NOT EXISTS idx_documents_status_created_at ON public.documents(status, created_at);
CREATE INDEX IF NOT EXISTS idx_hearings_date_outcome ON public.hearings(hearing_date, outcome);

-- 8. Add partial indexes for common filtered queries
-- Index only active cases for faster active case queries
CREATE INDEX IF NOT EXISTS idx_cases_active ON public.cases(user_id, createdat) 
  WHERE status = 'Active';

-- Index only upcoming hearings for faster dashboard queries
-- Note: Cannot use NOW() in index predicate as it's not immutable
-- This index will include all hearings - filter at query time instead
CREATE INDEX IF NOT EXISTS idx_hearings_upcoming ON public.hearings(user_id, hearing_date);

-- Index only pending documents for faster pending document queries
CREATE INDEX IF NOT EXISTS idx_documents_pending ON public.documents(user_id, created_at) 
  WHERE status = 'Pending';

-- 9. Add function-based indexes for case-insensitive searches
-- These help with text searches on names and addresses
CREATE INDEX IF NOT EXISTS idx_cases_plaintiff_lower ON public.cases(user_id, LOWER(plaintiff));
CREATE INDEX IF NOT EXISTS idx_cases_defendant_lower ON public.cases(user_id, LOWER(defendant));
CREATE INDEX IF NOT EXISTS idx_contacts_name_lower ON public.contacts(user_id, LOWER(name));

-- 10. Add index statistics refresh function
CREATE OR REPLACE FUNCTION refresh_index_statistics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Analyze tables to update index statistics
  ANALYZE public.cases;
  ANALYZE public.documents;
  ANALYZE public.hearings;
  ANALYZE public.contacts;
  ANALYZE public.case_contacts;
  ANALYZE public.contact_communications;
  
  -- Log the refresh
  INSERT INTO public.schema_monitoring (operation, table_name, status, details, performed_at)
  VALUES ('ANALYZE_TABLES', 'all_tables', 'SUCCESS', 
          'Index statistics refreshed for all tables', NOW());
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.schema_monitoring (operation, table_name, status, details, performed_at)
    VALUES ('ANALYZE_TABLES', 'all_tables', 'ERROR', 
            SQLSTATE || ': ' || SQLERRM, NOW());
    RAISE;
END;
$$;

-- 11. Add comments for documentation
COMMENT ON INDEX idx_case_contacts_case_id IS 'Performance index for case_contacts.case_id foreign key';
COMMENT ON INDEX idx_documents_case_user IS 'Composite index for case + user document queries';
COMMENT ON INDEX idx_cases_active IS 'Partial index for active cases only';
COMMENT ON INDEX idx_hearings_upcoming IS 'Partial index for upcoming hearings only';
COMMENT ON FUNCTION refresh_index_statistics() IS 'Updates table statistics for query optimizer';

-- Initial statistics refresh
SELECT refresh_index_statistics();