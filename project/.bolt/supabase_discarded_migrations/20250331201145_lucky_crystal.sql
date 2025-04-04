/*
  # ATLAS CHAT FULL Access Management

  1. New Functions
    - `admin_grant_atlas_chat`: Grants ATLAS CHAT FULL access to specific users
    - `admin_revoke_atlas_chat`: Revokes ATLAS CHAT FULL access
    
  2. Security
    - Functions restricted to service_role
    - Input validation and error handling
*/

-- Function to grant ATLAS CHAT FULL access
CREATE OR REPLACE FUNCTION admin_grant_atlas_chat(
  user_email TEXT,
  plan_duration TEXT DEFAULT 'monthly' -- 'monthly', 'trimestral', '10days'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  plan_name TEXT;
  duration_hours INTEGER;
BEGIN
  -- Find user ID by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN 'User not found';
  END IF;

  -- Set plan details based on duration
  CASE plan_duration
    WHEN 'monthly' THEN
      plan_name := 'ATLAS CHAT FULL - Mensal';
      duration_hours := 720; -- 30 days
    WHEN 'trimestral' THEN
      plan_name := 'ATLAS CHAT FULL - Trimestral';
      duration_hours := 2160; -- 90 days
    WHEN '10days' THEN
      plan_name := 'ATLAS CHAT FULL - 10 Dias';
      duration_hours := 240; -- 10 days
    ELSE
      RETURN 'Invalid plan duration. Use: monthly, trimestral, or 10days';
  END CASE;

  -- Update user's profile
  UPDATE profiles
  SET 
    plan_type = plan_name,
    plan_expires_at = CURRENT_TIMESTAMP + (duration_hours || ' hours')::interval,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;

  RETURN format('ATLAS CHAT FULL access granted to %s with plan: %s', user_email, plan_name);
END;
$$;

-- Function to revoke ATLAS CHAT FULL access
CREATE OR REPLACE FUNCTION admin_revoke_atlas_chat(
  user_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user ID by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN 'User not found';
  END IF;

  -- Remove ATLAS CHAT FULL access
  UPDATE profiles
  SET 
    plan_type = NULL,
    plan_expires_at = NULL,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id
  AND plan_type LIKE 'ATLAS CHAT FULL%';

  RETURN format('ATLAS CHAT FULL access revoked from %s', user_email);
END;
$$;

-- Grant execute permissions to service_role
REVOKE ALL ON FUNCTION admin_grant_atlas_chat FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_revoke_atlas_chat FROM PUBLIC;

GRANT EXECUTE ON FUNCTION admin_grant_atlas_chat TO service_role;
GRANT EXECUTE ON FUNCTION admin_revoke_atlas_chat TO service_role;

-- Example usage (commented out)
-- SELECT admin_grant_atlas_chat('user@example.com', 'monthly');
-- SELECT admin_revoke_atlas_chat('user@example.com');

-- Add comments
COMMENT ON FUNCTION admin_grant_atlas_chat IS 'Grants ATLAS CHAT FULL access to a user. Usage: SELECT admin_grant_atlas_chat(''user@email.com'', ''monthly'');';
COMMENT ON FUNCTION admin_revoke_atlas_chat IS 'Revokes ATLAS CHAT FULL access from a user. Usage: SELECT admin_revoke_atlas_chat(''user@email.com'');';