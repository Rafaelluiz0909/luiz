/*
  # Correção da estrutura do banco de dados

  1. Alterações
    - Garante que todas as tabelas tenham as colunas necessárias
    - Recria os triggers corretamente
    - Adiciona funções de atualização
*/

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que profiles tenha todas as colunas necessárias
DO $$ 
BEGIN
  -- Adicionar colunas se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN plan_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'plan_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN plan_expires_at timestamptz;
  END IF;
END $$;

-- Recriar trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Função para processar pagamento aprovado
CREATE OR REPLACE FUNCTION process_approved_payment()
RETURNS TRIGGER AS $$
DECLARE
  expiration_time timestamptz;
BEGIN
  -- Calcular data de expiração baseado no plano
  SELECT 
    CURRENT_TIMESTAMP + (duration_hours || ' hours')::interval 
  INTO expiration_time
  FROM plans 
  WHERE id = NEW.plan_id;

  -- Atualizar perfil do usuário
  UPDATE profiles
  SET 
    plan_type = (SELECT name FROM plans WHERE id = NEW.plan_id),
    plan_expires_at = expiration_time,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;

  -- Criar ou atualizar assinatura
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    payment_id,
    expires_at
  ) VALUES (
    NEW.user_id,
    NEW.plan_id,
    NEW.id,
    expiration_time
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;