-- SECURITY AUDIT SYSTEM: Monitor RLS violations and security events
-- This migration creates a comprehensive security monitoring system
-- to track RLS policy violations and maintain audit trails

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  attempted_record_id text,
  blocked_at timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  session_id text,
  policy_name text,
  severity text DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_blocked_at ON public.security_audit_log (blocked_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_table_name ON public.security_audit_log (table_name);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON public.security_audit_log (severity);

-- Enable RLS on audit log (users can only see their own violations)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_can_view_own_audit_logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "system_can_insert_audit_logs" ON public.security_audit_log;

-- Allow users to see their own audit entries
CREATE POLICY "users_can_view_own_audit_logs"
  ON public.security_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow system to insert audit logs (using service role)
CREATE POLICY "system_can_insert_audit_logs"
  ON public.security_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create function to log RLS violations
CREATE OR REPLACE FUNCTION log_rls_violation(
  p_table_name text,
  p_operation text,
  p_attempted_record_id text DEFAULT NULL,
  p_policy_name text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    table_name,
    operation,
    user_id,
    attempted_record_id,
    policy_name,
    details,
    severity,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    p_table_name,
    p_operation,
    auth.uid(),
    p_attempted_record_id,
    p_policy_name,
    p_details,
    CASE 
      WHEN p_table_name IN ('case_parties', 'cases') THEN 'CRITICAL'
      WHEN p_table_name IN ('documents', 'contacts') THEN 'ERROR'
      ELSE 'WARNING'
    END,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    current_setting('request.jwt.claims', true)::jsonb->>'session_id'
  );
  
  -- Log to server logs as well for immediate alerting
  RAISE LOG 'RLS_VIOLATION: table=% operation=% user=% record=% policy=%', 
    p_table_name, p_operation, auth.uid(), p_attempted_record_id, p_policy_name;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failures break the main operation
    RAISE LOG 'Failed to log RLS violation: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION log_rls_violation(text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION log_rls_violation(text, text, text, text, jsonb) TO service_role;

-- Create function to check for recent RLS violations
CREATE OR REPLACE FUNCTION check_rls_violations(
  time_window interval DEFAULT '1 hour'::interval
)
RETURNS TABLE(
  alert_level text,
  violation_count bigint,
  time_window_desc text,
  critical_violations bigint,
  error_violations bigint,
  warning_violations bigint,
  affected_tables text[],
  unique_users bigint
) AS $$
DECLARE
  v_violation_count bigint;
  v_critical_count bigint;
  v_error_count bigint;
  v_warning_count bigint;
BEGIN
  -- Count violations by severity
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE severity = 'CRITICAL'),
    COUNT(*) FILTER (WHERE severity = 'ERROR'),
    COUNT(*) FILTER (WHERE severity = 'WARNING')
  INTO v_violation_count, v_critical_count, v_error_count, v_warning_count
  FROM public.security_audit_log
  WHERE blocked_at > now() - time_window;
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN v_critical_count > 0 THEN 'CRITICAL'
      WHEN v_error_count > 5 THEN 'ERROR'
      WHEN v_violation_count > 20 THEN 'ERROR'
      WHEN v_violation_count > 5 THEN 'WARNING'
      ELSE 'OK'
    END as alert_level,
    v_violation_count as violation_count,
    time_window::text as time_window_desc,
    v_critical_count as critical_violations,
    v_error_count as error_violations,
    v_warning_count as warning_violations,
    ARRAY(
      SELECT DISTINCT table_name 
      FROM public.security_audit_log 
      WHERE blocked_at > now() - time_window
    ) as affected_tables,
    (
      SELECT COUNT(DISTINCT user_id)
      FROM public.security_audit_log 
      WHERE blocked_at > now() - time_window
    ) as unique_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users for monitoring
GRANT EXECUTE ON FUNCTION check_rls_violations(interval) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_violations(interval) TO service_role;

-- Create function to get security dashboard metrics
CREATE OR REPLACE FUNCTION get_security_metrics(
  lookback_hours integer DEFAULT 24
)
RETURNS TABLE(
  metric_name text,
  metric_value bigint,
  metric_description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_violations'::text, 
         COUNT(*)::bigint,
         'Total RLS violations in last ' || lookback_hours || ' hours'
  FROM public.security_audit_log
  WHERE blocked_at > now() - (lookback_hours || ' hours')::interval
  
  UNION ALL
  
  SELECT 'critical_violations'::text,
         COUNT(*)::bigint,
         'Critical severity violations'
  FROM public.security_audit_log
  WHERE blocked_at > now() - (lookback_hours || ' hours')::interval
  AND severity = 'CRITICAL'
  
  UNION ALL
  
  SELECT 'unique_violators'::text,
         COUNT(DISTINCT user_id)::bigint,
         'Unique users with violations'
  FROM public.security_audit_log
  WHERE blocked_at > now() - (lookback_hours || ' hours')::interval
  
  UNION ALL
  
  SELECT 'case_parties_violations'::text,
         COUNT(*)::bigint,
         'Violations on case_parties table (critical)'
  FROM public.security_audit_log
  WHERE blocked_at > now() - (lookback_hours || ' hours')::interval
  AND table_name = 'case_parties'
  
  UNION ALL
  
  SELECT 'total_users_active'::text,
         COUNT(DISTINCT auth.uid())::bigint,
         'Total active users in timeframe'
  FROM auth.users
  WHERE last_sign_in_at > now() - (lookback_hours || ' hours')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users for dashboard
GRANT EXECUTE ON FUNCTION get_security_metrics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_metrics(integer) TO service_role;

-- Create notification function for critical violations
CREATE OR REPLACE FUNCTION notify_critical_violation(
  p_table_name text,
  p_user_id uuid,
  p_details jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  -- Log the critical violation with maximum severity
  PERFORM log_rls_violation(
    p_table_name,
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    NULL,
    'critical_violation_detected',
    jsonb_build_object(
      'alert_type', 'CRITICAL_SECURITY_VIOLATION',
      'table', p_table_name,
      'user_id', p_user_id,
      'timestamp', now(),
      'details', p_details
    )
  );
  
  -- In a real implementation, this would also:
  -- 1. Send email/SMS alerts to admins
  -- 2. Create incident in monitoring system
  -- 3. Potentially block the user temporarily
  
  RAISE WARNING 'CRITICAL SECURITY VIOLATION: User % attempted unauthorized access to %', 
    p_user_id, p_table_name;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role for automatic notifications
GRANT EXECUTE ON FUNCTION notify_critical_violation(text, uuid, jsonb) TO service_role;

-- Create automated monitoring view for easy querying
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  date_trunc('hour', blocked_at) as hour,
  table_name,
  severity,
  COUNT(*) as violation_count,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT operation) as operations
FROM public.security_audit_log
WHERE blocked_at > now() - interval '7 days'
GROUP BY date_trunc('hour', blocked_at), table_name, severity
ORDER BY hour DESC, violation_count DESC;

-- Grant access to the dashboard view
GRANT SELECT ON security_dashboard TO authenticated;
GRANT SELECT ON security_dashboard TO service_role;

-- Create alert thresholds configuration table
CREATE TABLE IF NOT EXISTS public.security_alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text UNIQUE NOT NULL,
  warning_threshold integer NOT NULL,
  error_threshold integer NOT NULL,
  critical_threshold integer NOT NULL,
  time_window_minutes integer DEFAULT 60,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default thresholds
INSERT INTO public.security_alert_thresholds (metric_name, warning_threshold, error_threshold, critical_threshold)
VALUES 
  ('total_violations_per_hour', 5, 20, 50),
  ('case_parties_violations_per_hour', 1, 3, 5),
  ('violations_per_user_per_hour', 3, 10, 20),
  ('unique_violators_per_hour', 2, 5, 10)
ON CONFLICT (metric_name) DO NOTHING;

-- Enable RLS on thresholds table
ALTER TABLE public.security_alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_can_manage_thresholds" ON public.security_alert_thresholds;
DROP POLICY IF EXISTS "authenticated_can_read_thresholds" ON public.security_alert_thresholds;

-- Only allow admins to modify thresholds (service role)
CREATE POLICY "service_role_can_manage_thresholds"
  ON public.security_alert_thresholds FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read thresholds
CREATE POLICY "authenticated_can_read_thresholds"
  ON public.security_alert_thresholds FOR SELECT
  TO authenticated
  USING (true);

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE '=== SECURITY AUDIT SYSTEM CREATED ===';
  RAISE NOTICE 'Key components:';
  RAISE NOTICE '✓ security_audit_log table for violation tracking';
  RAISE NOTICE '✓ check_rls_violations() function for monitoring';
  RAISE NOTICE '✓ get_security_metrics() function for dashboard';
  RAISE NOTICE '✓ security_dashboard view for reporting';
  RAISE NOTICE '✓ Default alert thresholds configured';
  RAISE NOTICE '';
  RAISE NOTICE 'The security audit system is now active and monitoring RLS violations.';
END $$;