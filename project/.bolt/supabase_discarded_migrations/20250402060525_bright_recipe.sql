/*
  # Add CPF Field and Withdrawal System

  1. Changes
    - Add CPF column to profiles table
    - Add withdrawal function with CPF validation
    - Update withdrawal webhook handling
*/

-- Add CPF column to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cpf text;

-- Create index for CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- Update withdrawal processing function to include CPF validation
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_user_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_withdrawal_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cpf text;
BEGIN
  -- Get user's CPF
  SELECT cpf INTO v_cpf
  FROM profiles
  WHERE id = p_user_id;

  -- Validate CPF exists
  IF v_cpf IS NULL THEN
    RAISE EXCEPTION 'CPF não cadastrado. Atualize seu perfil para sacar.';
  END IF;

  -- Process withdrawal
  INSERT INTO beta_game_transactions (
    wallet_id,
    type,
    amount,
    game_id
  ) VALUES (
    p_wallet_id,
    'withdraw',
    p_amount,
    p_withdrawal_id
  );

  -- Update wallet balance
  UPDATE beta_game_wallets
  SET 
    balance = balance - p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_wallet_id;
END;
$$;