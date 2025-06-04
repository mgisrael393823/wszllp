-- Dashboard Materialized Views - Simplified version for WSZ LLP
-- Only uses tables and columns that exist in the database

-- Drop any existing views to start fresh
DROP MATERIALIZED VIEW IF EXISTS dashboard_combined_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dashboard_cases_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dashboard_hearings_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dashboard_documents_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dashboard_contacts_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dashboard_activity_summary CASCADE;

-- 1. Cases Summary Materialized View
CREATE MATERIALIZED VIEW dashboard_cases_summary AS
SELECT 
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE status NOT IN ('CLOSED', 'DISMISSED')) as active_cases,
    COUNT(*) FILTER (WHERE status = 'INTAKE' OR status = 'Intake') as intake_cases,
    COUNT(*) FILTER (WHERE status IN ('CLOSED', 'DISMISSED')) as closed_cases,
    COUNT(*) FILTER (WHERE createdat >= CURRENT_DATE - INTERVAL '30 days') as new_cases_last_30_days,
    COUNT(*) FILTER (WHERE createdat >= CURRENT_DATE - INTERVAL '7 days') as new_cases_last_7_days,
    AVG(CASE 
        WHEN status IN ('CLOSED', 'DISMISSED') AND updatedat > createdat
        THEN EXTRACT(EPOCH FROM (updatedat - createdat))/86400
        ELSE NULL 
    END) as avg_case_duration_days
FROM public.cases;

-- 2. Hearings Summary Materialized View  
CREATE MATERIALIZED VIEW dashboard_hearings_summary AS
SELECT 
    COUNT(*) as total_hearings,
    COUNT(*) FILTER (WHERE hearing_date > NOW()) as upcoming_hearings,
    COUNT(*) FILTER (WHERE hearing_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') as hearings_next_30_days,
    COUNT(*) FILTER (WHERE hearing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as hearings_next_7_days,
    COUNT(*) FILTER (WHERE hearing_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours') as hearings_next_24_hours,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_hearings,
    COUNT(*) FILTER (WHERE status = 'MISSED' OR (hearing_date < NOW() AND status = 'SCHEDULED')) as missed_hearings
FROM public.hearings;

-- 3. Documents Summary Materialized View
CREATE MATERIALIZED VIEW dashboard_documents_summary AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'PENDING' OR status = 'Pending') as pending_documents,
    COUNT(*) FILTER (WHERE status = 'SERVED' OR status = 'Served') as served_documents,
    COUNT(*) FILTER (WHERE status = 'FAILED' OR status = 'Failed') as failed_documents,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_documents_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_documents_last_7_days,
    COUNT(DISTINCT case_id) as cases_with_documents,
    COUNT(*) FILTER (WHERE type = 'COMPLAINT' OR type = 'Complaint') as complaint_documents,
    COUNT(*) FILTER (WHERE type = 'SUMMONS' OR type = 'Summons') as summons_documents,
    COUNT(*) FILTER (WHERE type = 'MOTION' OR type = 'Motion') as motion_documents
FROM public.documents;

-- 4. Contacts Summary Materialized View
CREATE MATERIALIZED VIEW dashboard_contacts_summary AS
SELECT 
    COUNT(*) as total_contacts,
    COUNT(*) FILTER (WHERE type = 'CLIENT') as client_contacts,
    COUNT(*) FILTER (WHERE type = 'OPPOSING_PARTY') as opposing_party_contacts,
    COUNT(*) FILTER (WHERE type = 'ATTORNEY') as attorney_contacts,
    COUNT(*) FILTER (WHERE type = 'COURT') as court_contacts,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_contacts_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_contacts_last_7_days
FROM public.contacts;

-- 5. Activity Summary Materialized View
CREATE MATERIALIZED VIEW dashboard_activity_summary AS
SELECT 
    -- Recent case activity
    (SELECT COUNT(*) FROM public.cases WHERE updatedat >= NOW() - INTERVAL '24 hours') as cases_updated_last_24h,
    (SELECT COUNT(*) FROM public.cases WHERE updatedat >= NOW() - INTERVAL '7 days') as cases_updated_last_7_days,
    
    -- Recent hearing activity
    (SELECT COUNT(*) FROM public.hearings WHERE updated_at >= NOW() - INTERVAL '24 hours') as hearings_updated_last_24h,
    (SELECT COUNT(*) FROM public.hearings WHERE updated_at >= NOW() - INTERVAL '7 days') as hearings_updated_last_7_days,
    
    -- Recent document activity
    (SELECT COUNT(*) FROM public.documents WHERE updated_at >= NOW() - INTERVAL '24 hours') as documents_updated_last_24h,
    (SELECT COUNT(*) FROM public.documents WHERE updated_at >= NOW() - INTERVAL '7 days') as documents_updated_last_7_days,
    
    -- Overall activity score
    (SELECT COUNT(*) FROM public.cases WHERE updatedat >= NOW() - INTERVAL '24 hours') +
    (SELECT COUNT(*) FROM public.hearings WHERE updated_at >= NOW() - INTERVAL '24 hours') +
    (SELECT COUNT(*) FROM public.documents WHERE updated_at >= NOW() - INTERVAL '24 hours') as total_activity_last_24h;

-- 6. Combined Dashboard Metrics View
CREATE MATERIALIZED VIEW dashboard_combined_metrics AS
SELECT 
    -- Cases metrics
    COALESCE(cs.total_cases, 0) as total_cases,
    COALESCE(cs.active_cases, 0) as active_cases,
    COALESCE(cs.intake_cases, 0) as intake_cases,
    COALESCE(cs.closed_cases, 0) as closed_cases,
    COALESCE(cs.new_cases_last_30_days, 0) as new_cases_last_30_days,
    COALESCE(cs.new_cases_last_7_days, 0) as new_cases_last_7_days,
    COALESCE(cs.avg_case_duration_days, 0) as avg_case_duration_days,
    
    -- Hearings metrics
    COALESCE(hs.total_hearings, 0) as total_hearings,
    COALESCE(hs.upcoming_hearings, 0) as upcoming_hearings,
    COALESCE(hs.hearings_next_30_days, 0) as hearings_next_30_days,
    COALESCE(hs.hearings_next_7_days, 0) as hearings_next_7_days,
    COALESCE(hs.hearings_next_24_hours, 0) as hearings_next_24_hours,
    COALESCE(hs.completed_hearings, 0) as completed_hearings,
    COALESCE(hs.missed_hearings, 0) as missed_hearings,
    
    -- Documents metrics  
    COALESCE(ds.total_documents, 0) as total_documents,
    COALESCE(ds.pending_documents, 0) as pending_documents,
    COALESCE(ds.served_documents, 0) as served_documents,
    COALESCE(ds.failed_documents, 0) as failed_documents,
    COALESCE(ds.new_documents_last_30_days, 0) as new_documents_last_30_days,
    COALESCE(ds.new_documents_last_7_days, 0) as new_documents_last_7_days,
    COALESCE(ds.cases_with_documents, 0) as cases_with_documents,
    COALESCE(ds.complaint_documents, 0) as complaint_documents,
    COALESCE(ds.summons_documents, 0) as summons_documents,
    COALESCE(ds.motion_documents, 0) as motion_documents,
    
    -- Contacts metrics
    COALESCE(cos.total_contacts, 0) as total_contacts,
    COALESCE(cos.client_contacts, 0) as client_contacts,
    COALESCE(cos.opposing_party_contacts, 0) as opposing_party_contacts,
    COALESCE(cos.attorney_contacts, 0) as attorney_contacts,
    COALESCE(cos.court_contacts, 0) as court_contacts,
    COALESCE(cos.new_contacts_last_30_days, 0) as new_contacts_last_30_days,
    COALESCE(cos.new_contacts_last_7_days, 0) as new_contacts_last_7_days,
    
    -- Activity metrics
    COALESCE(acts.cases_updated_last_24h, 0) as cases_updated_last_24h,
    COALESCE(acts.cases_updated_last_7_days, 0) as cases_updated_last_7_days,
    COALESCE(acts.hearings_updated_last_24h, 0) as hearings_updated_last_24h,
    COALESCE(acts.hearings_updated_last_7_days, 0) as hearings_updated_last_7_days,
    COALESCE(acts.documents_updated_last_24h, 0) as documents_updated_last_24h,
    COALESCE(acts.documents_updated_last_7_days, 0) as documents_updated_last_7_days,
    COALESCE(acts.total_activity_last_24h, 0) as total_activity_last_24h,
    
    -- Computed KPIs
    CASE 
        WHEN COALESCE(cs.total_cases, 0) > 0 
        THEN ROUND((COALESCE(cs.active_cases, 0)::NUMERIC / cs.total_cases) * 100, 1)
        ELSE 0 
    END as active_cases_percentage,
    
    CASE 
        WHEN COALESCE(ds.total_documents, 0) > 0 
        THEN ROUND((COALESCE(ds.pending_documents, 0)::NUMERIC / ds.total_documents) * 100, 1)
        ELSE 0 
    END as pending_documents_percentage,
    
    CASE 
        WHEN COALESCE(hs.total_hearings, 0) > 0 
        THEN ROUND((COALESCE(hs.hearings_next_30_days, 0)::NUMERIC / hs.total_hearings) * 100, 1)
        ELSE 0 
    END as hearings_next_30_days_percentage,
    
    -- Refresh timestamp
    NOW() as last_refreshed
FROM 
    dashboard_cases_summary cs,
    dashboard_hearings_summary hs,
    dashboard_documents_summary ds,
    dashboard_contacts_summary cos,
    dashboard_activity_summary acts;

-- Create indexes for better performance
CREATE INDEX idx_dashboard_cases_summary ON dashboard_cases_summary (total_cases);
CREATE INDEX idx_dashboard_hearings_summary ON dashboard_hearings_summary (total_hearings);
CREATE INDEX idx_dashboard_documents_summary ON dashboard_documents_summary (total_documents);
CREATE INDEX idx_dashboard_contacts_summary ON dashboard_contacts_summary (total_contacts);

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
END;
$$ LANGUAGE plpgsql;

-- Grant SELECT permissions
GRANT SELECT ON dashboard_cases_summary TO authenticated, anon;
GRANT SELECT ON dashboard_hearings_summary TO authenticated, anon;
GRANT SELECT ON dashboard_documents_summary TO authenticated, anon;
GRANT SELECT ON dashboard_contacts_summary TO authenticated, anon;
GRANT SELECT ON dashboard_activity_summary TO authenticated, anon;
GRANT SELECT ON dashboard_combined_metrics TO authenticated, anon;

-- Grant EXECUTE permission on the refresh function
GRANT EXECUTE ON FUNCTION refresh_dashboard_materialized_views() TO authenticated;

-- Initial refresh of all views
SELECT refresh_dashboard_materialized_views();