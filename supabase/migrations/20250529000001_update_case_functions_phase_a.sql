-- Update case management functions to support Phase A enhanced fields

BEGIN;

-- Drop existing function to avoid signature conflicts
DROP FUNCTION IF EXISTS public.create_case_with_transaction;

-- Update create_case_with_transaction function to accept Phase A parameters
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
  -- Insert new case with enhanced fields
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

  -- Insert petitioner record if provided
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

  -- Insert defendant records if provided
  IF p_defendants IS NOT NULL AND jsonb_array_length(p_defendants) > 0 THEN
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

-- Update function permissions
GRANT EXECUTE ON FUNCTION public.create_case_with_transaction TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_case_with_transaction IS 'Enhanced function to create cases with Phase A features: payment accounts, amount in controversy, and party information';

COMMIT;