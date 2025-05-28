-- Migration: Create atomic database functions for case management
-- These functions ensure transactional safety for case and document creation

BEGIN;

-- Create atomic function for case creation
CREATE OR REPLACE FUNCTION public.create_case_with_transaction(
  p_user_id UUID,
  p_jurisdiction TEXT,
  p_county TEXT,
  p_case_type TEXT,
  p_attorney_id TEXT,
  p_reference_id TEXT,
  p_payment_account_id TEXT DEFAULT NULL,
  p_amount_in_controversy DECIMAL(10,2) DEFAULT NULL,
  p_show_amount_in_controversy BOOLEAN DEFAULT FALSE,
  p_petitioner JSONB DEFAULT NULL,
  p_defendants JSONB DEFAULT '[]',
  p_status TEXT DEFAULT 'Open',
  p_case_category TEXT DEFAULT '7'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_case_id UUID;
  v_defendant JSONB;
BEGIN
  -- Insert new case and return the ID
  INSERT INTO public.cases (
    id,
    plaintiff,
    defendant,
    address,
    status,
    payment_account_id,
    amount_in_controversy,
    show_amount_in_controversy
  ) VALUES (
    gen_random_uuid(),
    CONCAT(p_jurisdiction, ' County Court'),
    CONCAT('Case ', p_reference_id, ' - ', p_case_type),
    CONCAT(p_county, ' County, ', UPPER(p_jurisdiction)),
    p_status,
    p_payment_account_id,
    p_amount_in_controversy,
    COALESCE(p_show_amount_in_controversy, FALSE)
  )
  RETURNING id INTO v_case_id;

  -- Insert petitioner record
  IF p_petitioner IS NOT NULL THEN
    INSERT INTO public.case_parties (
      case_id,
      party_type,
      is_business,
      business_name,
      first_name,
      last_name,
      address_line_1,
      city,
      state,
      zip_code
    ) VALUES (
      v_case_id,
      'petitioner',
      (p_petitioner->>'type') = 'business',
      p_petitioner->>'businessName',
      p_petitioner->>'firstName',
      p_petitioner->>'lastName',
      p_petitioner->>'addressLine1',
      p_petitioner->>'city',
      p_petitioner->>'state',
      p_petitioner->>'zipCode'
    );
  END IF;

  -- Insert defendant records
  IF p_defendants IS NOT NULL THEN
    FOR v_defendant IN SELECT * FROM jsonb_array_elements(p_defendants)
    LOOP
      INSERT INTO public.case_parties (
        case_id,
        party_type,
        is_business,
        business_name,
        first_name,
        last_name,
        address_line_1,
        city,
        state,
        zip_code
      ) VALUES (
        v_case_id,
        'defendant',
        FALSE,
        NULL,
        v_defendant->>'firstName',
        v_defendant->>'lastName',
        v_defendant->>'addressLine1',
        v_defendant->>'city',
        v_defendant->>'state',
        v_defendant->>'zipCode'
      );
    END LOOP;
  END IF;

  RETURN v_case_id;
END;
$$;

-- Create atomic function for document creation with foreign key validation
CREATE OR REPLACE FUNCTION public.create_document_with_validation(
  p_case_id UUID,
  p_envelope_id TEXT,
  p_filing_id TEXT,
  p_file_name TEXT,
  p_doc_type TEXT,
  p_efile_status TEXT,
  p_efile_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id UUID;
  v_case_exists BOOLEAN;
BEGIN
  -- Validate that the case exists
  SELECT EXISTS(SELECT 1 FROM public.cases WHERE id = p_case_id) INTO v_case_exists;
  
  IF NOT v_case_exists THEN
    RAISE EXCEPTION 'Case with ID % does not exist', p_case_id;
  END IF;

  -- Check for duplicate envelope_id + filing_id combination
  IF EXISTS(
    SELECT 1 FROM public.documents 
    WHERE envelope_id = p_envelope_id 
    AND filing_id = p_filing_id
    AND envelope_id IS NOT NULL 
    AND filing_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Document with envelope_id % and filing_id % already exists', p_envelope_id, p_filing_id;
  END IF;

  -- Insert new document
  INSERT INTO public.documents (
    case_id,
    envelope_id,
    filing_id,
    original_filename,
    type,
    file_url,
    status,
    efile_status,
    efile_timestamp
  ) VALUES (
    p_case_id,
    p_envelope_id,
    p_filing_id,
    p_file_name,
    p_doc_type,
    '', -- file_url not needed for e-filed documents
    'Pending',
    p_efile_status,
    p_efile_timestamp
  )
  RETURNING id INTO v_document_id;

  RETURN v_document_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_case_with_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_document_with_validation TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.create_case_with_transaction IS 'Atomically creates a new case with validation';
COMMENT ON FUNCTION public.create_document_with_validation IS 'Atomically creates a document with foreign key validation and duplicate prevention';

COMMIT;