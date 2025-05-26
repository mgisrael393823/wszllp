-- Schema versioning and monitoring system
-- This migration creates infrastructure for tracking schema changes and monitoring

-- Create schema_versions table for tracking migrations
CREATE TABLE IF NOT EXISTS public.schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  migration_file TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  rollback_sql TEXT,
  checksum TEXT,
  execution_time_ms INTEGER,
  is_success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Ensure versions are applied in order
  CONSTRAINT version_format CHECK (version ~ '^\d{14}_[a-z0-9_]+$')
);

-- Create indexes for version tracking
CREATE INDEX idx_schema_versions_version ON public.schema_versions (version);
CREATE INDEX idx_schema_versions_applied_at ON public.schema_versions (applied_at);
CREATE INDEX idx_schema_versions_success ON public.schema_versions (is_success);

-- Create migration_logs table for detailed logging
CREATE TABLE IF NOT EXISTS public.migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_version TEXT NOT NULL,
  log_level TEXT NOT NULL CHECK (log_level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_migration_logs_version ON public.migration_logs (migration_version);
CREATE INDEX idx_migration_logs_level ON public.migration_logs (log_level);
CREATE INDEX idx_migration_logs_created_at ON public.migration_logs (created_at);

-- Create system_health table for monitoring
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  tags JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_health_metric ON public.system_health (metric_name);
CREATE INDEX idx_system_health_recorded_at ON public.system_health (recorded_at);

-- Create schema_monitoring table for tracking database operations
CREATE TABLE IF NOT EXISTS public.schema_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'ERROR', 'WARNING')),
  details TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schema_monitoring_operation ON public.schema_monitoring (operation);
CREATE INDEX idx_schema_monitoring_table ON public.schema_monitoring (table_name);
CREATE INDEX idx_schema_monitoring_status ON public.schema_monitoring (status);
CREATE INDEX idx_schema_monitoring_performed_at ON public.schema_monitoring (performed_at);

-- Function to log migration events
CREATE OR REPLACE FUNCTION log_migration_event(
  p_version TEXT,
  p_level TEXT,
  p_message TEXT,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.migration_logs (migration_version, log_level, message, context)
  VALUES (p_version, p_level, p_message, p_context)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record system metrics
CREATE OR REPLACE FUNCTION record_metric(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metric_unit TEXT DEFAULT NULL,
  p_tags JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO public.system_health (metric_name, metric_value, metric_unit, tags)
  VALUES (p_metric_name, p_metric_value, p_metric_unit, p_tags)
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get current schema version
CREATE OR REPLACE FUNCTION get_current_schema_version()
RETURNS TEXT AS $$
DECLARE
  current_version TEXT;
BEGIN
  SELECT version INTO current_version
  FROM public.schema_versions
  WHERE is_success = true
  ORDER BY applied_at DESC
  LIMIT 1;
  
  RETURN COALESCE(current_version, 'none');
END;
$$ LANGUAGE plpgsql;

-- Function to validate schema integrity
CREATE OR REPLACE FUNCTION validate_schema_integrity()
RETURNS TABLE(
  table_name TEXT,
  issue_type TEXT,
  description TEXT,
  severity TEXT
) AS $$
BEGIN
  -- Check for missing foreign key constraints
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    'missing_fk'::TEXT as issue_type,
    'Table references another table without foreign key constraint'::TEXT as description,
    'medium'::TEXT as severity
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_name = t.table_name
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    )
    AND t.table_name IN ('case_contacts', 'contact_communications'); -- Tables that should have FKs

  -- Check for tables without RLS
  RETURN QUERY
  SELECT 
    schemaname::TEXT as table_name,
    'missing_rls'::TEXT as issue_type,
    'Table does not have Row Level Security enabled'::TEXT as description,
    'high'::TEXT as severity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_versions', 'migration_logs', 'system_health')
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = pg_tables.tablename
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    );

  -- Check for missing indexes on foreign keys
  RETURN QUERY
  SELECT 
    tc.table_name::TEXT,
    'missing_fk_index'::TEXT as issue_type,
    ('Foreign key column ' || kcu.column_name || ' lacks index')::TEXT as description,
    'medium'::TEXT as severity
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes i
      WHERE i.schemaname = 'public'
        AND i.tablename = tc.table_name
        AND position(kcu.column_name in i.indexdef) > 0
    );

END;
$$ LANGUAGE plpgsql;

-- Insert current migrations into version tracking
INSERT INTO public.schema_versions (version, description, migration_file, applied_by, checksum) VALUES
('20250523160000_create_contacts_table', 'Create contacts table with validation and RLS', '20250523160000_create_contacts_table.sql', 'system', 'contacts_v1'),
('20250523160001_create_case_contacts_table', 'Create case_contacts junction table', '20250523160001_create_case_contacts_table.sql', 'system', 'case_contacts_v1'),
('20250523160002_create_contact_communications_table', 'Create contact_communications for interaction tracking', '20250523160002_create_contact_communications_table.sql', 'system', 'communications_v1'),
('20250523160003_enhanced_rls_policies', 'Enhanced RLS policies with user-based access control', '20250523160003_enhanced_rls_policies.sql', 'system', 'rls_enhanced_v1'),
('20250523160004_schema_versioning_and_monitoring', 'Schema versioning and monitoring infrastructure', '20250523160004_schema_versioning_and_monitoring.sql', 'system', 'monitoring_v1')
ON CONFLICT (version) DO NOTHING;

-- Log the completion of this migration
SELECT log_migration_event(
  '20250523160004_schema_versioning_and_monitoring',
  'INFO',
  'Schema versioning and monitoring system initialized',
  '{"tables_created": ["schema_versions", "migration_logs", "system_health", "schema_monitoring"], "functions_created": ["log_migration_event", "record_metric", "get_current_schema_version", "validate_schema_integrity"]}'::jsonb
);

-- Record initial system metrics
SELECT record_metric('schema_version_count', (SELECT COUNT(*) FROM public.schema_versions), 'count', '{"component": "schema_management"}'::jsonb);
SELECT record_metric('contacts_table_created', 1, 'boolean', '{"migration": "20250523160000"}'::jsonb);
SELECT record_metric('case_contacts_table_created', 1, 'boolean', '{"migration": "20250523160001"}'::jsonb);

-- Create views for monitoring
CREATE OR REPLACE VIEW public.migration_status AS
SELECT 
  sv.version,
  sv.description,
  sv.applied_at,
  sv.is_success,
  sv.execution_time_ms,
  sv.error_message,
  CASE 
    WHEN sv.is_success THEN '✅'
    ELSE '❌'
  END as status_icon
FROM public.schema_versions sv
ORDER BY sv.applied_at DESC;

CREATE OR REPLACE VIEW public.system_metrics_summary AS
SELECT 
  metric_name,
  COUNT(*) as measurement_count,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  MAX(recorded_at) as last_recorded
FROM public.system_health
GROUP BY metric_name
ORDER BY last_recorded DESC;

-- Add comments for documentation
COMMENT ON TABLE public.schema_versions IS 'Tracks all database schema migrations and their status';
COMMENT ON TABLE public.migration_logs IS 'Detailed logs for migration operations and events';
COMMENT ON TABLE public.system_health IS 'System performance and health metrics';
COMMENT ON TABLE public.schema_monitoring IS 'Tracks database operations and maintenance tasks';
COMMENT ON FUNCTION log_migration_event IS 'Log events during migration operations';
COMMENT ON FUNCTION record_metric IS 'Record system performance metrics';
COMMENT ON FUNCTION validate_schema_integrity IS 'Validate database schema for common issues';