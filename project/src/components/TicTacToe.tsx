import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { Loader2, X as XIcon, Circle, RefreshCw, Search, ArrowLeft } from 'lucide-react';

interface Game {
  id: string;
  player_x: string;
  player_o: string | null;
  current_turn: string;
  winner: string | null;
  status: 'waiting' | 'playing' | 'finished';
  board: (string | null)[];
  room_name: string;
}

export function TicTacToe() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInterval, setSearchInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Verificar se o usuário já está em um jogo
    checkExistingGame();

    // Inscrever-se para atualizações em tempo real
    const gameSubscription = supabase
      .channel('game_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tic_tac_toe_games',
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

  useEffect(() => {
    // Iniciar busca por jogo quando não houver jogo ativo
    if (!game && !isSearching && user) {
      startSearching();
    }
  }, [game, isSearching, user]);

  const handleGameUpdate = (payload: any) => {
    const updatedGame = payload.new as Game;
    
    if (updatedGame && (updatedGame.player_x === user?.id || updatedGame.player_o === user?.id)) {
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
        .from('tic_tac_toe_games')
        .select('*')
        .or(`player_x.eq.${user?.id},player_o.eq.${user?.id}`)
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
        .from('tic_tac_toe_games')
        .select('*')
        .eq('status', 'waiting')
        .is('player_o', null)
        .neq('player_x', user.id)
        .limit(1)
        .single();

      if (availableGame) {
        // Encontrou um jogo, tentar entrar
        const { data: joinedGame, error: joinError } = await supabase
          .from('tic_tac_toe_games')
          .update({
            player_o: user.id,
            status: 'playing',
            current_turn: availableGame.player_x // Primeiro jogador (X) começa
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
        .from('tic_tac_toe_games')
        .insert({
          player_x: user.id,
          current_turn: user.id,
          status: 'waiting',
          board: Array(9).fill(null),
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
    if (game && game.status === 'waiting' && game.player_x === user?.id) {
      supabase
        .from('tic_tac_toe_games')
        .delete()
        .eq('id', game.id)
        .then(() => {
          setGame(null);
        });
    }
  };

  const makeMove = async (position: number) => {
    if (!game || !user) return;
    if (game.status !== 'playing') return;
    if (game.current_turn !== user.id) return;
    if (game.board[position] !== null) return;

    const symbol = game.player_x === user.id ? 'X' : 'O';
    const nextTurn = game.player_x === user.id ? game.player_o : game.player_x;

    try {
      const newBoard = [...game.board];
      newBoard[position] = symbol;

      const { error: updateError } = await supabase
        .from('tic_tac_toe_games')
        .update({
          board: newBoard,
          current_turn: nextTurn
        })
        .eq('id', game.id);

      if (updateError) throw updateError;

      const { error: moveError } = await supabase
        .from('tic_tac_toe_moves')
        .insert({
          game_id: game.id,
          player_id: user.id,
          position,
          symbol
        });

      if (moveError) throw moveError;
    } catch (err) {
      console.error('Erro ao fazer jogada:', err);
      setError('Erro ao fazer jogada. Por favor, tente novamente.');
    }
  };

  const startNewGame = () => {
    setError(null);
    setGame(null);
    setIsSearching(false);
    if (searchInterval) {
      clearInterval(searchInterval);
      setSearchInterval(null);
    }
    startSearching();
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
            <h2 className="text-2xl font-bold text-white mb-8">Jogo da Velha</h2>
            
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
        <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
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
              <div className="space-y-3">
                <div className="text-gray-300">
                  {game?.winner === user?.id ? (
                    <span className="text-green-500">Você venceu!</span>
                  ) : game?.winner ? (
                    <span className="text-red-500">Você perdeu!</span>
                  ) : (
                    <span className="text-gray-500">Empate!</span>
                  )}
                </div>
                <button
                  onClick={startNewGame}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Jogar Novamente
                </button>
              </div>
            )}
          </div>

          {/* Tabuleiro */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {game?.board.map((cell, index) => (
              <button
                key={index}
                onClick={() => makeMove(index)}
                disabled={
                  game.status !== 'playing' ||
                  game.current_turn !== user?.id ||
                  cell !== null
                }
                className={`
                  aspect-square bg-zinc-900 rounded-lg flex items-center justify-center
                  ${
                    game.status === 'playing' &&
                    game.current_turn === user?.id &&
                    cell === null
                      ? 'hover:bg-zinc-700'
                      : ''
                  }
                  ${
                    game.status === 'finished' &&
                    cell !== null
                      ? 'opacity-75'
                      : ''
                  }
                  transition-colors
                `}
              >
                {cell === 'X' ? (
                  <XIcon className="w-8 h-8 text-red-500" />
                ) : cell === 'O' ? (
                  <Circle className="w-8 h-8 text-blue-500" />
                ) : null}
              </button>
            ))}
          </div>

          {/* Informações dos Jogadores */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div>
              Você: {game?.player_x === user?.id ? 'X' : 'O'}
            </div>
            <div>
              Oponente: {game?.player_x === user?.id ? 'O' : 'X'}
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