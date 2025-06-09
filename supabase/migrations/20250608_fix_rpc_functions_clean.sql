-- FIX RPC FUNCTIONS: Clean version that drops existing functions first
-- This migration fixes the existing RPC functions that were missing user_id assignments

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.create_case_with_transaction CASCADE;
DROP FUNCTION IF EXISTS public.create_document_with_validation CASCADE;
DROP FUNCTION IF EXISTS public.create_contact_with_validation CASCADE;
DROP FUNCTION IF EXISTS public.create_hearing_with_validation CASCADE;

-- Create fixed create_case_with_transaction function
CREATE FUNCTION public.create_case_with_transaction(
  p_plaintiff TEXT,
  p_defendant TEXT,
  p_address TEXT,
  p_status TEXT DEFAULT 'Open'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_case_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate required parameters
  IF p_plaintiff IS NULL OR LENGTH(TRIM(p_plaintiff)) = 0 THEN
    RAISE EXCEPTION 'Plaintiff name is required';
  END IF;
  
  -- Generate new case ID
  v_case_id := gen_random_uuid();
  
  -- Insert new case with proper user_id assignment
  INSERT INTO public.cases (
    id,
    user_id,  -- CRITICAL: Include user_id
    plaintiff,
    defendant,
    address,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_case_id,
    v_current_user_id,  -- Set user_id properly
    TRIM(p_plaintiff),
    p_defendant,
    p_address,
    p_status,
    now(),
    now()
  );
  
  -- Log the case creation for audit
  PERFORM log_rls_violation(
    'cases',
    'CREATE_SUCCESS',
    v_case_id::text,
    'create_case_with_transaction',
    jsonb_build_object(
      'case_id', v_case_id,
      'user_id', v_current_user_id,
      'operation', 'case_creation'
    )
  );

  RETURN v_case_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure
    PERFORM log_rls_violation(
      'cases',
      'CREATE_FAILED',
      NULL,
      'create_case_with_transaction',
      jsonb_build_object(
        'error', SQLERRM,
        'user_id', v_current_user_id,
        'operation', 'case_creation_failed'
      )
    );
    RAISE;
END;
$$;

-- Create fixed create_document_with_validation function
CREATE FUNCTION public.create_document_with_validation(
  p_case_id UUID,
  p_type TEXT,
  p_file_url TEXT,
  p_status TEXT DEFAULT 'Pending',
  p_original_filename TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id UUID;
  v_case_exists BOOLEAN;
  v_current_user_id UUID;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate that the case exists and user has access to it
  SELECT EXISTS(
    SELECT 1 FROM public.cases 
    WHERE id = p_case_id 
    AND user_id = v_current_user_id
  ) INTO v_case_exists;
  
  IF NOT v_case_exists THEN
    -- Log unauthorized access attempt
    PERFORM notify_critical_violation(
      'documents',
      v_current_user_id,
      jsonb_build_object(
        'attempted_case_id', p_case_id,
        'operation', 'unauthorized_document_creation'
      )
    );
    RAISE EXCEPTION 'Case with ID % does not exist or user does not have access', p_case_id;
  END IF;

  -- Generate new document ID
  v_document_id := gen_random_uuid();

  -- Insert new document with proper user_id
  INSERT INTO public.documents (
    id,
    user_id,  -- CRITICAL: Include user_id
    case_id,
    type,
    file_url,
    status,
    original_filename,
    created_at,
    updated_at
  ) VALUES (
    v_document_id,
    v_current_user_id,  -- Set user_id properly
    p_case_id,
    p_type,
    p_file_url,
    p_status,
    p_original_filename,
    now(),
    now()
  );
  
  -- Log successful document creation
  PERFORM log_rls_violation(
    'documents',
    'CREATE_SUCCESS',
    v_document_id::text,
    'create_document_with_validation',
    jsonb_build_object(
      'document_id', v_document_id,
      'case_id', p_case_id,
      'user_id', v_current_user_id,
      'operation', 'document_creation'
    )
  );

  RETURN v_document_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure
    PERFORM log_rls_violation(
      'documents',
      'CREATE_FAILED',
      NULL,
      'create_document_with_validation',
      jsonb_build_object(
        'error', SQLERRM,
        'case_id', p_case_id,
        'user_id', v_current_user_id,
        'operation', 'document_creation_failed'
      )
    );
    RAISE;
END;
$$;

-- Create helper function to create contact with proper user_id
CREATE FUNCTION public.create_contact_with_validation(
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate required parameters
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RAISE EXCEPTION 'Contact name is required';
  END IF;
  
  -- Generate new contact ID
  v_contact_id := gen_random_uuid();
  
  -- Insert new contact with proper user_id
  INSERT INTO public.contacts (
    id,
    user_id,  -- Include user_id
    name,
    email,
    phone,
    address,
    created_at,
    updated_at
  ) VALUES (
    v_contact_id,
    v_current_user_id,  -- Set user_id properly
    TRIM(p_name),
    p_email,
    p_phone,
    p_address,
    now(),
    now()
  );
  
  -- Log successful contact creation
  PERFORM log_rls_violation(
    'contacts',
    'CREATE_SUCCESS',
    v_contact_id::text,
    'create_contact_with_validation',
    jsonb_build_object(
      'contact_id', v_contact_id,
      'user_id', v_current_user_id,
      'operation', 'contact_creation'
    )
  );

  RETURN v_contact_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure
    PERFORM log_rls_violation(
      'contacts',
      'CREATE_FAILED',
      NULL,
      'create_contact_with_validation',
      jsonb_build_object(
        'error', SQLERRM,
        'user_id', v_current_user_id,
        'operation', 'contact_creation_failed'
      )
    );
    RAISE;
END;
$$;

-- Create helper function to create hearing with proper user_id
CREATE FUNCTION public.create_hearing_with_validation(
  p_case_id UUID,
  p_hearing_date TIMESTAMP WITH TIME ZONE,
  p_court_name TEXT DEFAULT NULL,
  p_hearing_type TEXT DEFAULT 'General',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hearing_id UUID;
  v_case_exists BOOLEAN;
  v_current_user_id UUID;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate that the case exists and user has access to it
  SELECT EXISTS(
    SELECT 1 FROM public.cases 
    WHERE id = p_case_id 
    AND user_id = v_current_user_id
  ) INTO v_case_exists;
  
  IF NOT v_case_exists THEN
    -- Log unauthorized access attempt
    PERFORM notify_critical_violation(
      'hearings',
      v_current_user_id,
      jsonb_build_object(
        'attempted_case_id', p_case_id,
        'operation', 'unauthorized_hearing_creation'
      )
    );
    RAISE EXCEPTION 'Case with ID % does not exist or user does not have access', p_case_id;
  END IF;
  
  -- Validate required parameters
  IF p_hearing_date IS NULL THEN
    RAISE EXCEPTION 'Hearing date is required';
  END IF;
  
  -- Generate new hearing ID
  v_hearing_id := gen_random_uuid();
  
  -- Insert new hearing with proper user_id
  INSERT INTO public.hearings (
    id,
    user_id,  -- Include user_id
    case_id,
    hearing_date,
    court_name,
    hearing_type,
    notes,
    created_at,
    updated_at
  ) VALUES (
    v_hearing_id,
    v_current_user_id,  -- Set user_id properly
    p_case_id,
    p_hearing_date,
    p_court_name,
    p_hearing_type,
    p_notes,
    now(),
    now()
  );
  
  -- Log successful hearing creation
  PERFORM log_rls_violation(
    'hearings',
    'CREATE_SUCCESS',
    v_hearing_id::text,
    'create_hearing_with_validation',
    jsonb_build_object(
      'hearing_id', v_hearing_id,
      'case_id', p_case_id,
      'user_id', v_current_user_id,
      'operation', 'hearing_creation'
    )
  );

  RETURN v_hearing_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure
    PERFORM log_rls_violation(
      'hearings',
      'CREATE_FAILED',
      NULL,
      'create_hearing_with_validation',
      jsonb_build_object(
        'error', SQLERRM,
        'case_id', p_case_id,
        'user_id', v_current_user_id,
        'operation', 'hearing_creation_failed'
      )
    );
    RAISE;
END;
$$;

-- Update the existing set_user_id trigger function to be more robust
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
  
  -- Always update the updated_at timestamp
  IF TG_TABLE_NAME IN ('cases', 'documents', 'contacts', 'hearings', 'case_contacts', 'contact_communications') THEN
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set user_id on INSERT for all tables
-- (These will only fire if user_id is NULL, allowing explicit setting)

-- Cases trigger
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.cases;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Documents trigger  
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.documents;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Contacts trigger
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.contacts;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Hearings trigger
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.hearings;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Add triggers for optional tables if they exist
DO $$
BEGIN
  -- Case contacts trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'case_contacts') THEN
    DROP TRIGGER IF EXISTS set_user_id_trigger ON public.case_contacts;
    CREATE TRIGGER set_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.case_contacts
      FOR EACH ROW
      EXECUTE FUNCTION set_user_id();
  END IF;
  
  -- Contact communications trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'contact_communications') THEN
    DROP TRIGGER IF EXISTS set_user_id_trigger ON public.contact_communications;
    CREATE TRIGGER set_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.contact_communications
      FOR EACH ROW
      EXECUTE FUNCTION set_user_id();
  END IF;
END $$;

-- Update function permissions
GRANT EXECUTE ON FUNCTION public.create_case_with_transaction(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_document_with_validation(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_contact_with_validation(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_hearing_with_validation(uuid, timestamptz, text, text, text) TO authenticated;

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE '=== RPC FUNCTION FIXES COMPLETED ===';
  RAISE NOTICE 'Updated functions:';
  RAISE NOTICE '✓ create_case_with_transaction (simplified parameters, sets user_id)';
  RAISE NOTICE '✓ create_document_with_validation (simplified parameters, sets user_id)';
  RAISE NOTICE '✓ create_contact_with_validation (new function)';
  RAISE NOTICE '✓ create_hearing_with_validation (new function)';
  RAISE NOTICE '✓ set_user_id trigger function (enhanced)';
  RAISE NOTICE '';
  RAISE NOTICE 'All functions now include:';
  RAISE NOTICE '- Proper user_id handling';
  RAISE NOTICE '- Security logging';
  RAISE NOTICE '- Authorization checks';
  RAISE NOTICE '- Automatic triggers for user_id assignment';
END $$;