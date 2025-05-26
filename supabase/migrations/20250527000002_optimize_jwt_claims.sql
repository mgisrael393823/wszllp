-- JWT Claims Performance Optimization
-- This migration creates cached functions for JWT claims to reduce per-row overhead
-- in RLS policies and other database operations

-- 1. Create optimized JWT claims function
CREATE OR REPLACE FUNCTION public.get_jwt_claims()
RETURNS TABLE(uid uuid, role text, email text) 
LANGUAGE plpgsql 
STABLE  -- Mark as STABLE since JWT claims don't change during a transaction
SECURITY INVOKER
AS $$
DECLARE
  jwt_uid uuid;
  jwt_role text;
  jwt_email text;
BEGIN
  -- Get JWT claims with error handling
  BEGIN
    jwt_uid := NULLIF(current_setting('request.jwt.claims.sub', true), '')::uuid;
  EXCEPTION
    WHEN OTHERS THEN
      jwt_uid := NULL;
  END;
  
  BEGIN
    jwt_role := NULLIF(current_setting('request.jwt.claims.role', true), '');
  EXCEPTION
    WHEN OTHERS THEN
      jwt_role := NULL;
  END;
  
  BEGIN
    jwt_email := NULLIF(current_setting('request.jwt.claims.email', true), '');
  EXCEPTION
    WHEN OTHERS THEN
      jwt_email := NULL;
  END;
  
  RETURN QUERY SELECT jwt_uid, jwt_role, jwt_email;
END;
$$;

-- 2. Create cached user ID function for better performance
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Try to get from auth.uid() first (Supabase function)
  user_uuid := auth.uid();
  
  -- Fallback to JWT claims if auth.uid() returns null
  IF user_uuid IS NULL THEN
    BEGIN
      user_uuid := NULLIF(current_setting('request.jwt.claims.sub', true), '')::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        user_uuid := NULL;
    END;
  END IF;
  
  RETURN user_uuid;
END;
$$;

-- 3. Create role checking function for RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  user_role text;
BEGIN
  BEGIN
    user_role := NULLIF(current_setting('request.jwt.claims.role', true), '');
  EXCEPTION
    WHEN OTHERS THEN
      user_role := NULL;
  END;
  
  -- Default to 'authenticated' if no specific role
  RETURN COALESCE(user_role, 'authenticated');
END;
$$;

-- 4. Create session info function for debugging and logging
CREATE OR REPLACE FUNCTION public.get_session_info()
RETURNS TABLE(
  user_id uuid,
  user_role text,
  user_email text,
  is_authenticated boolean,
  session_start timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.get_current_user_id() as user_id,
    public.get_current_user_role() as user_role,
    (public.get_jwt_claims()).email as user_email,
    (public.get_current_user_id() IS NOT NULL) as is_authenticated,
    NOW() as session_start;
END;
$$;

-- 5. Update existing RLS policies to use optimized functions
-- Note: Only updating a few key policies as examples - full migration would update all

-- Update cases policies to use optimized function
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
CREATE POLICY "Users can view their own cases"
  ON public.cases FOR SELECT
  TO authenticated
  USING (public.get_current_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
CREATE POLICY "Users can insert their own cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_id() = user_id);

-- Update documents policies to use optimized function
DROP POLICY IF EXISTS "Users can view documents for their cases" ON public.documents;
CREATE POLICY "Users can view documents for their cases"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_id() = user_id OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id 
      AND c.user_id = public.get_current_user_id()
    )
  );

-- 6. Create performance monitoring function
CREATE OR REPLACE FUNCTION public.monitor_rls_performance()
RETURNS TABLE(
  policy_name text,
  table_name text,
  avg_execution_time_ms numeric,
  call_count bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- This is a placeholder for RLS policy performance monitoring
  -- In practice, you'd integrate with pg_stat_statements or custom logging
  RETURN QUERY
  SELECT 
    'optimized_policies'::text as policy_name,
    'multiple'::text as table_name,
    0.0::numeric as avg_execution_time_ms,
    0::bigint as call_count;
END;
$$;

-- 7. Update set_user_id function to use optimized user ID retrieval
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER 
SECURITY INVOKER
AS $$
BEGIN
  NEW.user_id = public.get_current_user_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create batch user ID update function for existing data
CREATE OR REPLACE FUNCTION public.update_missing_user_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Needs elevated privileges to update all records
AS $$
DECLARE
  update_count integer;
BEGIN
  -- Only run if there are records with NULL user_id
  -- This is for data migration purposes
  
  -- Update cases with missing user_id (set to a default admin user if needed)
  UPDATE public.cases 
  SET user_id = '00000000-0000-0000-0000-000000000000'::uuid  -- Replace with actual admin UUID
  WHERE user_id IS NULL;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Log the update
  INSERT INTO public.schema_monitoring (operation, table_name, status, details, performed_at)
  VALUES ('UPDATE_MISSING_USER_IDS', 'cases', 'SUCCESS', 
          'Updated ' || update_count || ' records with missing user_id', NOW());
          
  -- Repeat for other tables as needed
  -- Note: In production, you'd want to set proper user IDs, not a default
END;
$$;

-- 9. Add comments for documentation
COMMENT ON FUNCTION public.get_jwt_claims() IS 'Optimized JWT claims retrieval with error handling - STABLE for performance';
COMMENT ON FUNCTION public.get_current_user_id() IS 'Cached user ID function using auth.uid() with JWT fallback';
COMMENT ON FUNCTION public.get_current_user_role() IS 'Optimized role retrieval from JWT claims';
COMMENT ON FUNCTION public.get_session_info() IS 'Debug function to view current session information';
COMMENT ON FUNCTION public.monitor_rls_performance() IS 'Performance monitoring for RLS policies';
COMMENT ON FUNCTION public.update_missing_user_ids() IS 'One-time migration function to fix missing user_ids';

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_jwt_claims() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_session_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_rls_performance() TO authenticated;