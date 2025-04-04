/*
  # Activate Atlas Chat Full for User

  1. Changes
    - Updates user's profile with "ATLAS CHAT FULL - Mensal" plan type
    - Sets expiration date to 30 days from now
*/

-- Update plan directly in profiles table
UPDATE profiles
SET 
  plan_type = 'ATLAS CHAT FULL - Mensal',
  plan_expires_at = CURRENT_TIMESTAMP + interval '720 hours',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'kingnaldoteste@gmail.com'
);

-- Log if user not found
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = 'kingnaldoteste@gmail.com'
  ) THEN
    RAISE NOTICE 'No user found with email kingnaldoteste@gmail.com';
  END IF;
END $$;