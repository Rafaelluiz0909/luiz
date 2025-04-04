/*
  # Adicionar Políticas RLS para Blackjack

  1. Novas Políticas
    - Permitir que jogadores criem mãos
    - Permitir que jogadores atualizem mãos
    - Permitir que jogadores vejam todas as mãos em andamento
    - Melhorar políticas de movimentos

  2. Segurança
    - Manter RLS ativo
    - Garantir acesso apropriado
*/

-- Remover políticas existentes de mãos
DROP POLICY IF EXISTS "Jogadores podem ver mãos dos seus jogos" ON blackjack_hands;

-- Adicionar políticas mais específicas para mãos
CREATE POLICY "Jogadores podem ver todas as mãos em andamento"
  ON blackjack_hands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Jogadores podem criar mãos"
  ON blackjack_hands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blackjack_games
      WHERE id = game_id 
      AND (auth.uid() = player_one OR auth.uid() = player_two)
      AND status = 'playing'
    )
  );

CREATE POLICY "Jogadores podem atualizar mãos na sua vez"
  ON blackjack_hands FOR UPDATE
  TO authenticated
  USING (current_player = auth.uid())
  WITH CHECK (current_player = auth.uid());

-- Remover políticas existentes de movimentos
DROP POLICY IF EXISTS "Jogadores podem ver movimentos" ON blackjack_moves;
DROP POLICY IF EXISTS "Jogadores podem fazer movimentos na sua vez" ON blackjack_moves;

-- Adicionar políticas mais específicas para movimentos
CREATE POLICY "Jogadores podem ver todos os movimentos"
  ON blackjack_moves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Jogadores podem fazer movimentos na sua vez"
  ON blackjack_moves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blackjack_hands
      WHERE id = hand_id 
      AND current_player = auth.uid()
      AND status = 'playing'
    )
  );

-- Melhorar índices para performance
CREATE INDEX IF NOT EXISTS idx_blackjack_hands_current_player 
  ON blackjack_hands(current_player);

CREATE INDEX IF NOT EXISTS idx_blackjack_hands_status 
  ON blackjack_hands(status);

CREATE INDEX IF NOT EXISTS idx_blackjack_moves_player_id 
  ON blackjack_moves(player_id);