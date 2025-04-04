/*
  # Add CPF to User Profile

  1. Changes
    - Add CPF to profile for user teste01@gmail.com
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'teste01@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update profile with CPF
  UPDATE profiles
  SET 
    cpf = '50016459806',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_id;

  -- Log success
  RAISE NOTICE 'CPF added successfully for user teste01@gmail.com';
END $$;