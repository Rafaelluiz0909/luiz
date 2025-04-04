/*
  # Sistema de Afiliados

  1. Novas Tabelas
    - `affiliate_links`: Armazena links únicos de afiliados
    - `affiliate_rewards`: Registra recompensas de indicações

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso específicas
*/

-- Criar tabela de links de afiliados
CREATE TABLE affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela de recompensas
CREATE TABLE affiliate_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) NOT NULL,
  referred_id uuid REFERENCES auth.users(id) NOT NULL,
  payment_id uuid REFERENCES payments(id) NOT NULL,
  reward_amount numeric(10,2) NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Adicionar coluna de código de afiliado aos pagamentos
ALTER TABLE payments
ADD COLUMN affiliate_code text REFERENCES affiliate_links(code);

-- Habilitar RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver seu próprio link" ON affiliate_links
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas recompensas" ON affiliate_rewards
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id);

-- Função para gerar código de afiliado
CREATE OR REPLACE FUNCTION generate_affiliate_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
  v_max_attempts integer := 10;
  v_current_attempt integer := 0;
BEGIN
  -- Verificar se usuário já tem um código
  SELECT code INTO v_code
  FROM affiliate_links
  WHERE user_id = p_user_id;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    EXIT WHEN v_current_attempt >= v_max_attempts;
    v_current_attempt := v_current_attempt + 1;
    
    -- Gerar código aleatório de 8 caracteres
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verificar se código existe
    SELECT EXISTS (
      
      SELECT 1 FROM affiliate_links WHERE code = v_code
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      -- Inserir novo código
      INSERT INTO affiliate_links (user_id, code)
      VALUES (p_user_id, v_code)
      ON CONFLICT (user_id) DO UPDATE
      SET code = EXCLUDED.code
      RETURNING code INTO v_code;
      
      RETURN v_code;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Não foi possível gerar um código único após % tentativas', v_max_attempts;
END;
$$;

-- Função para processar recompensa de afiliado
CREATE OR REPLACE FUNCTION handle_affiliate_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se pagamento foi aprovado e tem código de afiliado
  IF NEW.status = 'completed' AND 
     OLD.status = 'pending' AND 
     NEW.affiliate_code IS NOT NULL THEN
    
    -- Registrar recompensa (50% do valor)
    INSERT INTO affiliate_rewards (
      referrer_id,
      referred_id,
      payment_id,
      reward_amount
    )
    SELECT 
      al.user_id,
      NEW.user_id,
      NEW.id,
      NEW.amount * 0.5
    FROM affiliate_links al
    WHERE al.code = NEW.affiliate_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para processar pagamento de afiliado
CREATE TRIGGER handle_affiliate_payment_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_affiliate_payment();

-- Criar índices para performance
CREATE INDEX idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_code ON affiliate_links(code);
CREATE INDEX idx_affiliate_rewards_referrer_id ON affiliate_rewards(referrer_id);
CREATE INDEX idx_affiliate_rewards_referred_id ON affiliate_rewards(referred_id);
CREATE INDEX idx_affiliate_rewards_payment_id ON affiliate_rewards(payment_id);
CREATE INDEX idx_payments_affiliate_code ON payments(affiliate_code);