/*
  # Correção do Sistema de Matchmaking do Blackjack

  1. Alterações
    - Corrige políticas de acesso
    - Adiciona trigger para atualizar updated_at
    - Melhora índices para performance
*/

-- Remover políticas existentes
DROP POLICY IF EXISTS "Jogadores podem ver jogos disponíveis ou próprios" ON blackjack_games;
DROP POLICY IF EXISTS "Jogadores podem criar jogos" ON blackjack_games;
DROP POLICY IF EXISTS "Jogadores podem atualizar seus jogos" ON blackjack_games;

-- Recriar políticas com regras mais específicas
CREATE POLICY "Jogadores podem ver jogos disponíveis ou próprios"
  ON blackjack_games FOR SELECT
  TO public
  USING (
    status = 'waiting' OR 
    auth.uid() = player_one OR 
    auth.uid() = player_two
  );

CREATE POLICY "Jogadores podem criar jogos"
  ON blackjack_games FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_one);

CREATE POLICY "Jogadores podem atualizar seus jogos"
  ON blackjack_games FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (player_one, player_two)
  )
  WITH CHECK (
    CASE
      WHEN auth.uid() = player_one AND player_two IS NULL THEN true
      WHEN auth.uid() = current_turn THEN true
      ELSE false
    END
  );

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_blackjack_games_updated_at
  BEFORE UPDATE ON blackjack_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Melhorar índices
DROP INDEX IF EXISTS idx_blackjack_games_status;
CREATE INDEX idx_blackjack_games_waiting_status 
  ON blackjack_games(status) 
  WHERE status = 'waiting';

CREATE INDEX idx_blackjack_games_player_two_null 
  ON blackjack_games(player_one) 
  WHERE player_two IS NULL;