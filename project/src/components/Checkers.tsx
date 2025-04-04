import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { Loader2, Search, ArrowLeft } from 'lucide-react';

interface Game {
  id: string;
  player_white: string;
  player_black: string | null;
  current_turn: string;
  winner: string | null;
  status: 'waiting' | 'playing' | 'finished';
  board: (string | null)[][];
  room_name: string;
}

interface Position {
  row: number;
  col: number;
}

export function Checkers() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInterval, setSearchInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Iniciar busca por jogo automaticamente
    startSearching();

    // Verificar se o usuário já está em um jogo
    checkExistingGame();

    // Inscrever-se para atualizações em tempo real
    const gameSubscription = supabase
      .channel('checkers_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkers_games',
        },
        handleGameUpdate
      )
      .subscribe();

    return () => {
      gameSubscription.unsubscribe();
      if (searchInterval) {
        clearInterval(searchInterval);
      }
    };
  }, [user]);

  const handleGameUpdate = (payload: any) => {
    const updatedGame = payload.new as Game;
    
    if (updatedGame && (updatedGame.player_white === user?.id || updatedGame.player_black === user?.id)) {
      setGame(updatedGame);
      setIsSearching(false);
      if (searchInterval) {
        clearInterval(searchInterval);
        setSearchInterval(null);
      }
    }
  };

  const checkExistingGame = async () => {
    try {
      const { data: existingGame } = await supabase
        .from('checkers_games')
        .select('*')
        .or(`player_white.eq.${user?.id},player_black.eq.${user?.id}`)
        .not('status', 'eq', 'finished')
        .single();

      if (existingGame) {
        setGame(existingGame);
        setIsSearching(false);
      }
    } catch (err) {
      // Se não encontrar jogo ativo, está ok
    } finally {
      setLoading(false);
    }
  };

  const searchForGame = async () => {
    if (!user) return;
    
    try {
      // Primeiro, procurar por jogos disponíveis
      const { data: availableGame } = await supabase
        .from('checkers_games')
        .select('*')
        .eq('status', 'waiting')
        .is('player_black', null)
        .neq('player_white', user.id)
        .limit(1)
        .single();

      if (availableGame) {
        // Encontrou um jogo, tentar entrar
        const { data: joinedGame, error: joinError } = await supabase
          .from('checkers_games')
          .update({
            player_black: user.id,
            status: 'playing',
            current_turn: availableGame.player_white // Jogador branco começa
          })
          .eq('id', availableGame.id)
          .select()
          .single();

        if (joinError) throw joinError;
        if (joinedGame) {
          setGame(joinedGame);
          setIsSearching(false);
          return;
        }
      }

      // Se não encontrou jogo disponível, criar um novo
      const { data: newGame, error: createError } = await supabase
        .from('checkers_games')
        .insert({
          player_white: user.id,
          current_turn: user.id,
          status: 'waiting',
          room_name: `Partida #${Math.random().toString(36).substring(7)}`
        })
        .select()
        .single();

      if (createError) throw createError;
      if (newGame) {
        setGame(newGame);
      }
    } catch (err) {
      console.error('Erro ao procurar jogo:', err);
      setError('Erro ao procurar partida. Por favor, tente novamente.');
      setIsSearching(false);
    }
  };

  const startSearching = () => {
    setIsSearching(true);
    setError(null);
    
    // Primeira busca imediata
    searchForGame();
    
    // Continuar procurando a cada 3 segundos
    const interval = setInterval(searchForGame, 3000);
    setSearchInterval(interval);
  };

  const stopSearching = () => {
    setIsSearching(false);
    if (searchInterval) {
      clearInterval(searchInterval);
      setSearchInterval(null);
    }
    
    // Se estiver em um jogo aguardando, cancelar
    if (game && game.status === 'waiting' && game.player_white === user?.id) {
      supabase
        .from('checkers_games')
        .delete()
        .eq('id', game.id)
        .then(() => {
          setGame(null);
        });
    }
  };

  const calculateValidMoves = (row: number, col: number) => {
    if (!game || !user) return [];

    const isWhite = game.player_white === user.id;
    const piece = game.board[row][col];
    
    if (!piece) return [];
    if ((piece === 'W' && !isWhite) || (piece === 'B' && isWhite)) return [];
    if (game.current_turn !== user.id) return [];

    const moves: Position[] = [];
    const direction = isWhite ? -1 : 1;

    // Movimento normal
    if (row + direction >= 0 && row + direction < 8) {
      // Diagonal esquerda
      if (col - 1 >= 0 && !game.board[row + direction][col - 1]) {
        moves.push({ row: row + direction, col: col - 1 });
      }
      // Diagonal direita
      if (col + 1 < 8 && !game.board[row + direction][col + 1]) {
        moves.push({ row: row + direction, col: col + 1 });
      }
    }

    // Captura
    if (row + direction * 2 >= 0 && row + direction * 2 < 8) {
      // Captura diagonal esquerda
      if (col - 2 >= 0 && 
          game.board[row + direction][col - 1] && 
          game.board[row + direction][col - 1] !== piece &&
          !game.board[row + direction * 2][col - 2]) {
        moves.push({ row: row + direction * 2, col: col - 2 });
      }
      // Captura diagonal direita
      if (col + 2 < 8 && 
          game.board[row + direction][col + 1] && 
          game.board[row + direction][col + 1] !== piece &&
          !game.board[row + direction * 2][col + 2]) {
        moves.push({ row: row + direction * 2, col: col + 2 });
      }
    }

    return moves;
  };

  const handlePieceClick = (row: number, col: number) => {
    if (!game || game.status !== 'playing' || game.current_turn !== user?.id) return;

    const piece = game.board[row][col];
    const isWhite = game.player_white === user?.id;
    
    if (piece && ((piece === 'W' && isWhite) || (piece === 'B' && !isWhite))) {
      setSelectedPiece({ row, col });
      setValidMoves(calculateValidMoves(row, col));
    } else if (selectedPiece) {
      const isValidMove = validMoves.some(move => 
        move.row === row && move.col === col
      );

      if (isValidMove) {
        makeMove(selectedPiece, { row, col });
      }

      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const makeMove = async (from: Position, to: Position) => {
    if (!game || !user) return;

    try {
      const newBoard = JSON.parse(JSON.stringify(game.board));
      const piece = newBoard[from.row][from.col];
      newBoard[from.row][from.col] = null;
      newBoard[to.row][to.col] = piece;

      // Verificar se é uma captura
      if (Math.abs(to.row - from.row) === 2) {
        const capturedRow = (from.row + to.row) / 2;
        const capturedCol = (from.col + to.col) / 2;
        newBoard[capturedRow][capturedCol] = null;
      }

      const { error: updateError } = await supabase
        .from('checkers_games')
        .update({
          board: newBoard,
          current_turn: game.player_white === user.id ? game.player_black : game.player_white
        })
        .eq('id', game.id);

      if (updateError) throw updateError;

      const { error: moveError } = await supabase
        .from('checkers_moves')
        .insert({
          game_id: game.id,
          player_id: user.id,
          from_position: [from.row, from.col],
          to_position: [to.row, to.col],
          captured_position: Math.abs(to.row - from.row) === 2 ? 
            [(from.row + to.row) / 2, (from.col + to.col) / 2] : 
            null
        });

      if (moveError) throw moveError;
    } catch (err) {
      console.error('Erro ao fazer jogada:', err);
      setError('Erro ao fazer jogada. Por favor, tente novamente.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Você precisa estar logado para jogar.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!game && !isSearching) {
    return (
      <div className="min-h-screen bg-zinc-900 p-4">
        <div className="max-w-7xl mx-auto mb-8">
          <button
            onClick={() => navigate('/games')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Jogos
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Damas</h2>
            
            <button
              onClick={startSearching}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Procurar Partida
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSearching && (!game || game.status === 'waiting')) {
    return (
      <div className="min-h-screen bg-zinc-900 p-4">
        <div className="max-w-7xl mx-auto mb-8">
          <button
            onClick={() => navigate('/games')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Jogos
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-3 text-gray-300 mb-6">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-lg">Procurando oponente...</span>
            </div>

            <button
              onClick={stopSearching}
              className="bg-zinc-700 text-white px-6 py-2 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/games')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Jogos
        </button>
      </div>
      <div className="flex items-center justify-center">
        <div className="bg-zinc-800 rounded-lg p-6">
          {/* Status do Jogo */}
          <div className="text-center mb-6">
            {game?.status === 'waiting' ? (
              <div className="flex items-center justify-center gap-3 text-gray-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                Aguardando oponente...
              </div>
            ) : game?.status === 'playing' ? (
              <div className="text-gray-300">
                {game.current_turn === user?.id ? (
                  <span className="text-green-500">Sua vez</span>
                ) : (
                  <span>Vez do oponente</span>
                )}
              </div>
            ) : (
              <div className="text-gray-300">
                {game?.winner === user?.id ? (
                  <span className="text-green-500">Você venceu!</span>
                ) : game?.winner ? (
                  <span className="text-red-500">Você perdeu!</span>
                ) : (
                  <span className="text-gray-500">Empate!</span>
                )}
              </div>
            )}
          </div>

          {/* Tabuleiro */}
          <div className="grid grid-cols-8 gap-1 bg-zinc-700 p-1 rounded-lg">
            {game?.board.map((row, rowIndex) => (
              row.map((piece, colIndex) => {
                const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                const isValidMove = validMoves.some(move => 
                  move.row === rowIndex && move.col === colIndex
                );

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handlePieceClick(rowIndex, colIndex)}
                    className={`
                      aspect-square w-12 md:w-16 flex items-center justify-center
                      ${isBlackSquare ? 'bg-zinc-900' : 'bg-zinc-600'}
                      ${isSelected ? 'ring-2 ring-yellow-500' : ''}
                      ${isValidMove ? 'ring-2 ring-green-500' : ''}
                      ${game.status === 'playing' && ((piece && game.current_turn === user?.id) || isValidMove) ? 'cursor-pointer hover:opacity-80' : ''}
                      transition-all duration-200
                    `}
                  >
                    {piece && (
                      <div className={`
                        w-8 h-8 md:w-10 md:h-10 rounded-full
                        ${piece === 'W' ? 'bg-white' : 'bg-black'}
                        shadow-lg
                      `} />
                    )}
                  </div>
                );
              })
            ))}
          </div>

          {/* Informações dos Jogadores */}
          <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
            <div>
              Você: {game?.player_white === user?.id ? 'Brancas' : 'Pretas'}
            </div>
            <div>
              Oponente: {game?.player_white === user?.id ? 'Pretas' : 'Brancas'}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}