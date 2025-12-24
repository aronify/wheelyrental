-- ============================================================================
-- ADMIN FUNCTION: Update Phone Number (Permanent Solution)
-- ============================================================================
-- This function allows phone numbers to be changed via admin access
-- while still preventing changes through the partner portal
-- ============================================================================

-- Create admin function to update company phone number
CREATE OR REPLACE FUNCTION public.admin_update_company_phone(
  p_company_id uuid,
  p_new_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_phone text;
  v_company_name text;
BEGIN
  -- Get current phone and company name for logging
  SELECT phone, name INTO v_old_phone, v_company_name
  FROM public.companies
  WHERE id = p_company_id;
  
  IF v_company_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Company not found',
      'company_id', p_company_id
    );
  END IF;
  
  -- Set session variable to allow phone update (bypasses trigger)
  PERFORM set_config('app.allow_phone_update', 'true', true);
  
  -- Update the phone number
  UPDATE public.companies
  SET phone = p_new_phone
  WHERE id = p_company_id;
  
  -- Clear the session variable
  PERFORM set_config('app.allow_phone_update', '', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'company_name', v_company_name,
    'old_phone', v_old_phone,
    'new_phone', p_new_phone,
    'message', 'Phone number updated successfully'
  );
END;
$$;

-- Create admin function to update phone by user ID
CREATE OR REPLACE FUNCTION public.admin_update_user_company_phone(
  p_user_id uuid,
  p_new_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_old_phone text;
BEGIN
  -- Find the company owned by this user
  SELECT id, name, phone INTO v_company_id, v_company_name, v_old_phone
  FROM public.companies
  WHERE owner_id = p_user_id
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No company found for this user',
      'user_id', p_user_id
    );
  END IF;
  
  -- Set session variable to allow phone update
  PERFORM set_config('app.allow_phone_update', 'true', true);
  
  -- Update the phone number
  UPDATE public.companies
  SET phone = p_new_phone
  WHERE id = v_company_id;
  
  -- Clear the session variable
  PERFORM set_config('app.allow_phone_update', '', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'company_name', v_company_name,
    'user_id', p_user_id,
    'old_phone', v_old_phone,
    'new_phone', p_new_phone,
    'message', 'Phone number updated successfully'
  );
END;
$$;

-- Grant execute permissions to service_role (for admin dashboard)
GRANT EXECUTE ON FUNCTION public.admin_update_company_phone(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user_company_phone(uuid, text) TO service_role;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- 
-- Update by company ID:
--   SELECT public.admin_update_company_phone(
--     'company-uuid-here'::uuid,
--     '+355 69 123 4567'
--   );
--
-- Update by user ID:
--   SELECT public.admin_update_user_company_phone(
--     'user-uuid-here'::uuid,
--     '+355 69 123 4567'
--   );
--
-- Both functions return JSON with success status and details
--
-- ============================================================================
