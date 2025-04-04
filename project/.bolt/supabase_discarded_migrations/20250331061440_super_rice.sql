/*
  # Sistema de Blackjack PVP

  1. Novas Tabelas
    - `blackjack_games`: Armazena as partidas em andamento
    - `blackjack_hands`: Armazena cada mão jogada
    - `blackjack_moves`: Armazena os movimentos dos jogadores

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso específicas
*/

-- Criar enum para status do jogo
CREATE TYPE blackjack_game_status AS ENUM ('waiting', 'playing', 'finished');
CREATE TYPE blackjack_move_type AS ENUM ('hit', 'stand');

-- Criar tabela de jogos
CREATE TABLE blackjack_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_one uuid REFERENCES auth.users(id),
  player_two uuid REFERENCES auth.users(id),
  current_turn uuid REFERENCES auth.users(id),
  player_one_wins integer DEFAULT 0,
  player_two_wins integer DEFAULT 0,
  status blackjack_game_status DEFAULT 'waiting',
  room_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de mãos
CREATE TABLE blackjack_hands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES blackjack_games(id),
  dealer_cards jsonb DEFAULT '[]',
  player_one_cards jsonb DEFAULT '[]',
  player_two_cards jsonb DEFAULT '[]',
  dealer_score integer DEFAULT 0,
  player_one_score integer DEFAULT 0,
  player_two_score integer DEFAULT 0,
  current_player uuid REFERENCES auth.users(id),
  status blackjack_game_status DEFAULT 'playing',
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de movimentos
CREATE TABLE blackjack_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_id uuid REFERENCES blackjack_hands(id),
  player_id uuid REFERENCES auth.users(id),
  move_type blackjack_move_type NOT NULL,
  card jsonb,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE blackjack_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackjack_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackjack_moves ENABLE ROW LEVEL SECURITY;

-- Políticas para jogos
CREATE POLICY "Jogadores podem ver jogos disponíveis ou próprios"
  ON blackjack_games FOR SELECT
  TO authenticated
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
  USING (auth.uid() IN (player_one, player_two));

-- Políticas para mãos
CREATE POLICY "Jogadores podem ver mãos dos seus jogos"
  ON blackjack_hands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blackjack_games
      WHERE id = game_id AND (
        auth.uid() = player_one OR 
        auth.uid() = player_two
      )
    )
  );

-- Políticas para movimentos
CREATE POLICY "Jogadores podem ver movimentos"
  ON blackjack_moves FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blackjack_hands h
      JOIN blackjack_games g ON g.id = h.game_id
      WHERE h.id = hand_id AND (
        auth.uid() = g.player_one OR 
        auth.uid() = g.player_two
      )
    )
  );

CREATE POLICY "Jogadores podem fazer movimentos na sua vez"
  ON blackjack_moves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blackjack_hands
      WHERE id = hand_id AND current_player = auth.uid()
    )
  );

-- Criar índices
CREATE INDEX idx_blackjack_games_player_one ON blackjack_games(player_one);
CREATE INDEX idx_blackjack_games_player_two ON blackjack_games(player_two);
CREATE INDEX idx_blackjack_games_status ON blackjack_games(status);
CREATE INDEX idx_blackjack_hands_game_id ON blackjack_hands(game_id);
CREATE INDEX idx_blackjack_moves_hand_id ON blackjack_moves(hand_id);