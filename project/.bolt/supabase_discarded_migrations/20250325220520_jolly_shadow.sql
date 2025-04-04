/*
  # Sistema de Pagamentos e Planos

  1. Novas Tabelas
    - `plans`: Armazena os planos disponíveis
    - `payments`: Registra os pagamentos realizados
    - `subscriptions`: Gerencia as assinaturas ativas
    - `payment_webhooks`: Registra callbacks de pagamento

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso específicas por função
    - Triggers para atualizações automáticas

  3. Dados Iniciais
    - Inserção dos planos padrão
*/

-- Criar enum para status de pagamento
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Criar enum para status de assinatura
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Tabela de planos
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  duration_hours integer NOT NULL,
  features jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_code text,
  transaction_id text,
  status payment_status DEFAULT 'pending',
  paid_at timestamptz,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  payment_id uuid REFERENCES payments(id) NOT NULL,
  status subscription_status DEFAULT 'active',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de webhooks de pagamento
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id),
  transaction_id text,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas para planos
CREATE POLICY "Todos podem ver planos ativos" ON plans
  FOR SELECT USING (active = true);

-- Políticas para pagamentos
CREATE POLICY "Usuários podem ver seus próprios pagamentos" ON payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus pagamentos" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para webhooks
CREATE POLICY "Sistema pode gerenciar webhooks" ON payment_webhooks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Função para processar pagamento aprovado
CREATE OR REPLACE FUNCTION process_approved_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o pagamento foi aprovado
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    -- Atualizar perfil do usuário
    UPDATE profiles
    SET 
      plan_type = (SELECT name FROM plans WHERE id = NEW.plan_id),
      plan_expires_at = NEW.expires_at
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
      NEW.expires_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar pagamento
CREATE TRIGGER payment_approved_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status = 'pending')
  EXECUTE FUNCTION process_approved_payment();

-- Inserir planos padrão
INSERT INTO plans (name, description, price, duration_hours, features) VALUES
  (
    'Teste Rápido',
    '1 hora de funções liberadas',
    10,
    1,
    '["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real"]'
  ),
  (
    'Plano Semanal',
    '10 dias de funções liberadas',
    70,
    240,
    '["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real", "Suporte prioritário"]'
  ),
  (
    'Plano Mensal',
    'Um mês de funções liberadas',
    120,
    720,
    '["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real", "Suporte prioritário", "Análises detalhadas"]'
  ),
  (
    'Plano Trimestral',
    '3 meses de funções liberadas',
    300,
    2160,
    '["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real", "Suporte VIP", "Análises detalhadas", "Consultoria personalizada"]'
  ),
  (
    'Acesso Vitalício',
    'Acesso vitalício a todas as funções',
    500,
    87600,
    '["Acesso ilimitado a todas as funções", "Atualizações gratuitas", "Suporte VIP", "Análises exclusivas", "Consultoria personalizada", "Prioridade em novos recursos"]'
  )
ON CONFLICT DO NOTHING;