/*
  # Setup inicial do sistema de pagamentos

  1. Novas Tabelas
    - `plans`: Catálogo de planos disponíveis
    - `payments`: Registro de pagamentos
    - `payment_webhooks`: Registro de webhooks de pagamento

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso específicas
    - Proteção de dados sensíveis

  3. Dados Iniciais
    - Inserção dos planos padrão
*/

-- Remover tabelas existentes se necessário
DROP TABLE IF EXISTS payment_webhooks CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- Criar tabela de planos
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL,
  duration_hours integer NOT NULL,
  features jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de pagamentos
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_code text,
  transaction_id text,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de webhooks
CREATE TABLE payment_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Usuários podem atualizar seus pagamentos" ON payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para webhooks
CREATE POLICY "Sistema pode gerenciar webhooks" ON payment_webhooks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

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
  );