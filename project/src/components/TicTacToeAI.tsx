import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X as XIcon, Circle, RefreshCw, ArrowLeft, Bot, Wallet } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

type Player = 'X' | 'O';
type Board = (Player | null)[];

interface WalletData {
  id: string;
  balance: number;
}

export function TicTacToeAI() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWallet();
    }
  }, [user]);

  const loadWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_game_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (err) {
      console.error('Erro ao carregar carteira:', err);
      setError('Erro ao carregar dados da carteira');
    } finally {
      setLoading(false);
    }
  };

  const checkWinner = (squares: Board): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
      [0, 4, 8], [2, 4, 6]             // Diagonais
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a] as Player;
      }
    }

    if (squares.every(square => square !== null)) {
      return 'draw';
    }

    return null;
  };

  const minimax = (squares: Board, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(squares);

    // Ajustar valores para tornar a IA menos agressiva
    if (result === 'X') return depth - 10; // Reduzir penalidade para vitória do jogador
    if (result === 'O') return 10 - depth; // Reduzir recompensa para vitória da IA
    if (result === 'draw') return 0;

    // Adicionar aleatoriedade para tornar a IA menos previsível
    const randomFactor = Math.random() * 2 - 1; // Valor entre -1 e 1

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          const score = minimax(squares, depth + 1, false) + randomFactor;
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          const score = minimax(squares, depth + 1, true) + randomFactor;
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const findBestMove = (squares: Board): number => {
    let bestScore = -Infinity;
    let bestMove = -1;
    let availableMoves: number[] = [];

    // Coletar todas as jogadas possíveis
    for (let i = 0; i < squares.length; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false);
        squares[i] = null;

        // Armazenar jogada e pontuação
        availableMoves.push(i);
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    // 40% de chance de fazer uma jogada aleatória em vez da melhor jogada
    if (Math.random() < 0.4 && availableMoves.length > 0) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    return bestMove;
  };

  const processGameResult = async (result: 'win' | 'loss' | 'draw') => {
    try {
      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user?.id,
        p_game_id: 'tictactoe-ai',
        p_result: result
      });

      if (error) throw error;
      await loadWallet();
    } catch (err) {
      console.error('Erro ao processar resultado:', err);
      setError('Erro ao processar resultado do jogo');
    }
  };

  const handleClick = async (index: number) => {
    if (!wallet || wallet.balance < 1) {
      setError('Saldo insuficiente para jogar. Deposite pelo menos R$ 5,00');
      return;
    }

    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      if (newWinner === 'X') {
        await processGameResult('win');
      } else if (newWinner === 'O') {
        await processGameResult('loss');
      } else {
        await processGameResult('draw');
      }
      return;
    }

    // IA faz sua jogada
    const aiMove = findBestMove(newBoard);
    if (aiMove !== -1) {
      newBoard[aiMove] = 'O';
      setBoard(newBoard);
      const finalWinner = checkWinner(newBoard);
      if (finalWinner) {
        setWinner(finalWinner);
        if (finalWinner === 'X') {
          await processGameResult('win');
        } else if (finalWinner === 'O') {
          await processGameResult('loss');
        } else {
          await processGameResult('draw');
        }
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Jogo da Velha vs IA</h2>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Bot className="w-5 h-5 text-blue-500" />
              <span>Você (X) vs IA (O)</span>
            </div>
          </div>

          {/* Saldo */}
          <div className="bg-zinc-900 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-300">
                <Wallet className="w-5 h-5 text-blue-500" />
                <span>Seu Saldo:</span>
              </div>
              <span className="text-lg font-bold text-white">
                R$ {wallet?.balance.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Custo por partida: R$ 1,00
            </p>
          </div>

          {/* Status do Jogo */}
          <div className="text-center mb-6">
            {winner ? (
              <div className="space-y-3">
                <div className="text-gray-300">
                  {winner === 'draw' ? (
                    <span className="text-gray-500">Empate!</span>
                  ) : winner === 'X' ? (
                    <span className="text-green-500">Você venceu! (+R$ 1,00)</span>
                  ) : (
                    <span className="text-red-500">IA venceu! (-R$ 1,00)</span>
                  )}
                </div>
                <button
                  onClick={resetGame}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Jogar Novamente
                </button>
              </div>
            ) : (
              <div className="text-gray-300">
                Sua vez
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm mb-6">
              {error}
            </div>
          )}

          {/* Tabuleiro */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={!!cell || !!winner || !wallet || wallet.balance < 1}
                className={`
                  aspect-square bg-zinc-900 rounded-lg flex items-center justify-center
                  ${!cell && !winner && wallet?.balance >= 1 ? 'hover:bg-zinc-700' : ''}
                  ${winner ? 'opacity-75' : ''}
                  transition-colors
                `}
              >
                {cell === 'X' ? (
                  <XIcon className="w-8 h-8 text-blue-500" />
                ) : cell === 'O' ? (
                  <Circle className="w-8 h-8 text-red-500" />
                ) : null}
              </button>
            ))}
          </div>

          {/* Dicas */}
          <div className="bg-zinc-900 rounded-lg p-4 text-sm text-gray-400">
            <h3 className="font-semibold text-gray-300 mb-2">Regras:</h3>
            <ul className="space-y-1">
              <li>• Depósito mínimo: R$ 5,00</li>
              <li>• Custo por partida: R$ 1,00</li>
              <li>• Vitória: +R$ 1,00</li>
              <li>• Derrota: -R$ 1,00</li>
              <li>• Empate: Sem alteração no saldo</li>
              <li>• Saque disponível após movimentar 100% do depósito</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}