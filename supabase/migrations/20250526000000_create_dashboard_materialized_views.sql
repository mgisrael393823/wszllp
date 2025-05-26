-- Dashboard Materialized Views for Performance Optimization
-- Creates pre-computed aggregations for fast dashboard loading

-- First, handle any trigger conflicts by dropping dependent triggers
DROP TRIGGER IF EXISTS refresh_dashboard_on_cases_change ON public.cases;
DROP TRIGGER IF EXISTS refresh_dashboard_on_hearings_change ON public.hearings;
DROP TRIGGER IF EXISTS refresh_dashboard_on_documents_change ON public.documents;
DROP TRIGGER IF EXISTS refresh_dashboard_on_contacts_change ON public.contacts;

-- 1. Cases Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_cases_summary AS
SELECT 
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE status = 'Active') as active_cases,
    COUNT(*) FILTER (WHERE status = 'Intake') as intake_cases,
    COUNT(*) FILTER (WHERE status = 'Closed') as closed_cases,
    COUNT(*) FILTER (WHERE createdat >= CURRENT_DATE - INTERVAL '30 days') as new_cases_last_30_days,
    COUNT(*) FILTER (WHERE createdat >= CURRENT_DATE - INTERVAL '7 days') as new_cases_last_7_days,
    AVG(EXTRACT(EPOCH FROM (COALESCE(updatedat, createdat) - createdat))/86400) as avg_case_duration_days
FROM public.cases;

-- 2. Hearings Summary Materialized View  
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_hearings_summary AS
SELECT 
    COUNT(*) as total_hearings,
    COUNT(*) FILTER (WHERE hearing_date > NOW()) as upcoming_hearings,
    COUNT(*) FILTER (WHERE hearing_date > NOW() AND hearing_date <= NOW() + INTERVAL '30 days') as hearings_next_30_days,
    COUNT(*) FILTER (WHERE hearing_date > NOW() AND hearing_date <= NOW() + INTERVAL '7 days') as hearings_next_7_days,
    COUNT(*) FILTER (WHERE hearing_date > NOW() AND hearing_date <= NOW() + INTERVAL '1 day') as hearings_next_24_hours,
    COUNT(*) FILTER (WHERE hearing_date < NOW() AND outcome IS NOT NULL) as completed_hearings,
    COUNT(*) FILTER (WHERE hearing_date < NOW() AND outcome IS NULL) as missed_hearings
FROM public.hearings;

-- 3. Documents Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_documents_summary AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'Pending') as pending_documents,
    COUNT(*) FILTER (WHERE status = 'Served') as served_documents,
    COUNT(*) FILTER (WHERE status = 'Failed') as failed_documents,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_documents_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_documents_last_7_days,
    COUNT(DISTINCT case_id) as cases_with_documents,
    COUNT(*) FILTER (WHERE type = 'Complaint') as complaint_documents,
    COUNT(*) FILTER (WHERE type = 'Summons') as summons_documents,
    COUNT(*) FILTER (WHERE type = 'Motion') as motion_documents
FROM public.documents;

-- 4. Contacts Summary Materialized View (if contacts table exists)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_contacts_summary AS
SELECT 
    COUNT(*) as total_contacts,
    COUNT(*) FILTER (WHERE role = 'Client') as client_contacts,
    COUNT(*) FILTER (WHERE role = 'Attorney') as attorney_contacts,
    COUNT(*) FILTER (WHERE role = 'Paralegal') as paralegal_contacts,
    COUNT(*) FILTER (WHERE role = 'PM') as pm_contacts,
    COUNT(*) FILTER (WHERE role = 'Other') as other_contacts,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_contacts_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_contacts_last_7_days
FROM public.contacts;

-- 5. Activity Summary Materialized View (case activity tracking)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_activity_summary AS
SELECT 
    -- Recent case activity
    COUNT(*) FILTER (WHERE c.updatedat >= CURRENT_DATE - INTERVAL '24 hours') as cases_updated_last_24h,
    COUNT(*) FILTER (WHERE c.updatedat >= CURRENT_DATE - INTERVAL '7 days') as cases_updated_last_7_days,
    
    -- Recent hearing activity
    (SELECT COUNT(*) FROM public.hearings WHERE updated_at >= CURRENT_DATE - INTERVAL '24 hours') as hearings_updated_last_24h,
    (SELECT COUNT(*) FROM public.hearings WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days') as hearings_updated_last_7_days,
    
    -- Recent document activity
    (SELECT COUNT(*) FROM public.documents WHERE updated_at >= CURRENT_DATE - INTERVAL '24 hours') as documents_updated_last_24h,
    (SELECT COUNT(*) FROM public.documents WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days') as documents_updated_last_7_days,
    
    -- Overall activity score
    (
        COUNT(*) FILTER (WHERE c.updatedat >= CURRENT_DATE - INTERVAL '24 hours') +
        (SELECT COUNT(*) FROM public.hearings WHERE updated_at >= CURRENT_DATE - INTERVAL '24 hours') +
        (SELECT COUNT(*) FROM public.documents WHERE updated_at >= CURRENT_DATE - INTERVAL '24 hours')
    ) as total_activity_last_24h
FROM public.cases c;

-- 6. Combined Dashboard Metrics View (joins all summaries)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_combined_metrics AS
SELECT 
    -- Cases metrics
    cs.total_cases,
    cs.active_cases,
    cs.intake_cases,
    cs.closed_cases,
    cs.new_cases_last_30_days,
    cs.new_cases_last_7_days,
    cs.avg_case_duration_days,
    
    -- Hearings metrics
    hs.total_hearings,
    hs.upcoming_hearings,
    hs.hearings_next_30_days,
    hs.hearings_next_7_days,
    hs.hearings_next_24_hours,
    hs.completed_hearings,
    hs.missed_hearings,
    
    -- Documents metrics  
    ds.total_documents,
    ds.pending_documents,
    ds.served_documents,
    ds.failed_documents,
    ds.new_documents_last_30_days,
    ds.new_documents_last_7_days,
    ds.cases_with_documents,
    ds.complaint_documents,
    ds.summons_documents,
    ds.motion_documents,
    
    -- Contacts metrics
    cos.total_contacts,
    cos.client_contacts,
    cos.attorney_contacts,
    cos.paralegal_contacts,
    cos.pm_contacts,
    cos.other_contacts,
    cos.new_contacts_last_30_days,
    cos.new_contacts_last_7_days,
    
    -- Activity metrics
    acts.cases_updated_last_24h,
    acts.cases_updated_last_7_days,
    acts.hearings_updated_last_24h,
    acts.hearings_updated_last_7_days,
    acts.documents_updated_last_24h,
    acts.documents_updated_last_7_days,
    acts.total_activity_last_24h,
    
    -- Computed KPIs
    ROUND((cs.active_cases::NUMERIC / NULLIF(cs.total_cases, 0)) * 100, 1) as active_cases_percentage,
    ROUND((ds.pending_documents::NUMERIC / NULLIF(ds.total_documents, 0)) * 100, 1) as pending_documents_percentage,
    ROUND((hs.hearings_next_30_days::NUMERIC / NULLIF(hs.upcoming_hearings, 0)) * 100, 1) as hearings_next_30_days_percentage,
    
    -- Refresh timestamp
    NOW() as last_refreshed
FROM dashboard_cases_summary cs
CROSS JOIN dashboard_hearings_summary hs  
CROSS JOIN dashboard_documents_summary ds
CROSS JOIN dashboard_contacts_summary cos
CROSS JOIN dashboard_activity_summary acts;


-- Create function to refresh all dashboard materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_cases_summary;
    REFRESH MATERIALIZED VIEW dashboard_hearings_summary;
    REFRESH MATERIALIZED VIEW dashboard_documents_summary;
    REFRESH MATERIALIZED VIEW dashboard_contacts_summary;
    REFRESH MATERIALIZED VIEW dashboard_activity_summary;
    REFRESH MATERIALIZED VIEW dashboard_combined_metrics;
    
    -- Log the refresh
    INSERT INTO public.schema_monitoring (operation, table_name, status, details, performed_at)
    VALUES ('REFRESH_DASHBOARD_VIEWS', 'dashboard_materialized_views', 'SUCCESS', 
            'All dashboard materialized views refreshed successfully', NOW());
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO public.schema_monitoring (operation, table_name, status, details, performed_at)
        VALUES ('REFRESH_DASHBOARD_VIEWS', 'dashboard_materialized_views', 'ERROR', 
                SQLSTATE || ': ' || SQLERRM, NOW());
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh dashboard views automatically on data changes
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh materialized views after any insert/update/delete
    PERFORM refresh_dashboard_materialized_views();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-refresh materialized views on data changes
-- Note: These will refresh on every change - consider batching for high-volume systems
DROP TRIGGER IF EXISTS refresh_dashboard_on_cases_change ON public.cases;
CREATE TRIGGER refresh_dashboard_on_cases_change
    AFTER INSERT OR UPDATE OR DELETE ON public.cases
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard_views();

DROP TRIGGER IF EXISTS refresh_dashboard_on_hearings_change ON public.hearings;
CREATE TRIGGER refresh_dashboard_on_hearings_change
    AFTER INSERT OR UPDATE OR DELETE ON public.hearings
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard_views();

DROP TRIGGER IF EXISTS refresh_dashboard_on_documents_change ON public.documents;
CREATE TRIGGER refresh_dashboard_on_documents_change
    AFTER INSERT OR UPDATE OR DELETE ON public.documents
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard_views();

-- Only create contacts trigger if contacts table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS refresh_dashboard_on_contacts_change ON public.contacts;
        CREATE TRIGGER refresh_dashboard_on_contacts_change
            AFTER INSERT OR UPDATE OR DELETE ON public.contacts
            FOR EACH STATEMENT
            EXECUTE FUNCTION trigger_refresh_dashboard_views();
    END IF;
END $$;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON dashboard_cases_summary TO authenticated, anon;
GRANT SELECT ON dashboard_hearings_summary TO authenticated, anon;
GRANT SELECT ON dashboard_documents_summary TO authenticated, anon;
GRANT SELECT ON dashboard_contacts_summary TO authenticated, anon;
GRANT SELECT ON dashboard_activity_summary TO authenticated, anon;
GRANT SELECT ON dashboard_combined_metrics TO authenticated, anon;

-- Initial refresh of all views
SELECT refresh_dashboard_materialized_views();