import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Bot, Brain, Lock } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  status: 'beta' | 'coming-soon' | 'locked';
}

export function GamesGallery() {
  const navigate = useNavigate();

  const games: Game[] = [
    {
      id: 'tictactoe-ai',
      title: 'Jogo da Velha vs IA',
      description: 'Jogue contra nossa IA e ganhe dinheiro! Cada vitória vale R$ 1,00.',
      icon: <Bot className="w-12 h-12 text-gray-500" />,
      route: '/games/tictactoe-ai',
      status: 'locked'
    },
    {
      id: 'tictactoe',
      title: 'Jogo da Velha PVP',
      description: 'Em breve: Desafie outros jogadores em partidas de Jogo da Velha em tempo real',
      icon: <Gamepad2 className="w-12 h-12 text-gray-500" />,
      route: '#',
      status: 'coming-soon'
    },
    {
      id: 'checkers',
      title: 'Damas',
      description: 'Em breve: Partidas de damas multiplayer em tempo real',
      icon: <Gamepad2 className="w-12 h-12 text-gray-500" />,
      route: '#',
      status: 'coming-soon'
    },
    {
      id: 'chess',
      title: 'Xadrez',
      description: 'Em breve: Jogue xadrez online contra outros jogadores',
      icon: <Gamepad2 className="w-12 h-12 text-gray-500" />,
      route: '#',
      status: 'coming-soon'
    }
  ];

  const handleGameClick = (game: Game) => {
    if (game.status === 'locked') {
      alert('Estamos quase prontos! Em breve você poderá jogar e ganhar dinheiro com nossos jogos clássicos.');
      return;
    }
    if (game.route !== '#') {
      navigate(game.route);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Jogos Beta</h1>
          <p className="text-gray-400">
            Experimente nossos jogos em desenvolvimento e ajude-nos a melhorá-los!
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game)}
              className={`bg-zinc-800 rounded-lg p-6 border ${
                game.status === 'locked'
                  ? 'border-yellow-600/50 hover:border-yellow-500 cursor-pointer'
                  : game.status === 'beta'
                  ? 'border-blue-600/50 hover:border-blue-500 cursor-pointer'
                  : 'border-red-600/20 opacity-75'
              } transition-all duration-200`}
            >
              <div className="flex flex-col items-center text-center">
                {game.icon}
                <h3 className="text-xl font-bold text-white mt-4 mb-2">
                  {game.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {game.description}
                </p>
                {game.status === 'locked' ? (
                  <div className="px-4 py-2 bg-yellow-600/20 text-yellow-500 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Em Breve
                  </div>
                ) : game.status === 'beta' ? (
                  <button
                    onClick={() => navigate(game.route)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Jogar Beta
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-zinc-700 text-gray-300 rounded-full text-xs">
                    Em breve
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}