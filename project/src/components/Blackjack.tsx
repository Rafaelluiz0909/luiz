import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { Loader2, Search, ArrowLeft } from 'lucide-react';

interface Game {
  id: string;
  player_one: string;
  player_two: string | null;
  current_turn: string;
  status: 'waiting' | 'playing' | 'finished';
  room_name: string;
}

export function Blackjack() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Verificar se o usuário já está em um jogo
    checkExistingGame();

    // Inscrever-se para atualizações em tempo real
    const gameSubscription = supabase
      .channel('blackjack_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blackjack_games',
        },
        handleGameUpdate
      )
      .subscribe();

    return () => {
      gameSubscription.unsubscribe();
    };
  }, [user]);

  const handleGameUpdate = (payload: any) => {
    const updatedGame = payload.new as Game;
    
    if (updatedGame && (updatedGame.player_one === user?.id || updatedGame.player_two === user?.id)) {
      console.log('Game updated:', updatedGame);
      setGame(updatedGame);
      setIsSearching(false);
    }
  };

  const checkExistingGame = async () => {
    try {
      const { data: existingGame } = await supabase
        .from('blackjack_games')
        .select('*')
        .or(`player_one.eq.${user?.id},player_two.eq.${user?.id}`)
        .not('status', 'eq', 'finished')
        .single();

      if (existingGame) {
        console.log('Found existing game:', existingGame);
        setGame(existingGame);
      }
    } catch (err) {
      console.log('No existing game found');
    } finally {
      setLoading(false);
    }
  };

  const startSearching = async () => {
    if (!user) return;
    setIsSearching(true);
    setError(null);

    try {
      // Primeiro, procurar por jogos disponíveis
      const { data: availableGame } = await supabase
        .from('blackjack_games')
        .select('*')
        .eq('status', 'waiting')
        .is('player_two', null)
        .neq('player_one', user.id)
        .limit(1)
        .single();

      if (availableGame) {
        console.log('Found available game:', availableGame);
        
        // Encontrou um jogo, tentar entrar
        const { data: joinedGame, error: joinError } = await supabase
          .from('blackjack_games')
          .update({
            player_two: user.id,
            status: 'playing',
            current_turn: availableGame.player_one
          })
          .eq('id', availableGame.id)
          .select()
          .single();

        if (joinError) throw joinError;
        if (joinedGame) {
          console.log('Joined game:', joinedGame);
          setGame(joinedGame);
          setIsSearching(false);
          return;
        }
      }

      // Se não encontrou jogo disponível, criar um novo
      console.log('Creating new game...');
      const { data: newGame, error: createError } = await supabase
        .from('blackjack_games')
        .insert({
          player_one: user.id,
          status: 'waiting',
          room_name: `Partida #${Math.random().toString(36).substring(7)}`
        })
        .select()
        .single();

      if (createError) throw createError;
      if (newGame) {
        console.log('Created new game:', newGame);
        setGame(newGame);
      }
    } catch (err) {
      console.error('Error searching for game:', err);
      setError('Erro ao procurar partida. Por favor, tente novamente.');
      setIsSearching(false);
    }
  };

  const stopSearching = () => {
    setIsSearching(false);
    
    // Se estiver em um jogo aguardando, cancelar
    if (game && game.status === 'waiting' && game.player_one === user?.id) {
      supabase
        .from('blackjack_games')
        .delete()
        .eq('id', game.id)
        .then(() => {
          setGame(null);
        });
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
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Blackjack PVP</h2>
            
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

  if (isSearching || (game && game.status === 'waiting')) {
    return (
      <div className="min-h-screen bg-zinc-900 p-4">
        <div className="max-w-7xl mx-auto mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
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

  // Aqui você implementará a interface do jogo quando ele estiver em andamento
  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>
      <div className="flex items-center justify-center">
        <div className="bg-zinc-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Partida em Andamento</h2>
          {/* Aqui você implementará a interface do jogo */}
        </div>
      </div>
    </div>
  );
}