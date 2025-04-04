import React, { useEffect, useState } from 'react';
import { CircleDot, HelpCircle, BarChart2, Flame, Map } from 'lucide-react';
import { PieChart } from './PieChart';
import { HotColdNumbers } from './HotColdNumbers';
import { RaceTrack } from './RaceTrack';
import { FloatingWindow } from './FloatingWindow';

interface RouletteResult {
  result: string;
  time: string;
}

interface FloatingWindowState {
  id: string;
  type: 'stats' | 'hotcold' | 'race';
  position: { x: number; y: number };
}

export function Roleta3() {
  const [results, setResults] = useState<RouletteResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDozenFilter, setShowDozenFilter] = useState(false);
  const [showRegionFilter, setShowRegionFilter] = useState(false);
  const [showHighLowFilter, setShowHighLowFilter] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [floatingWindows, setFloatingWindows] = useState<FloatingWindowState[]>([]);

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 8, 10, 11, 13, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  
  const voisinsNumbers = [2, 4, 7, 12, 3, 15, 19, 18, 21, 22, 25, 26, 28, 29, 32, 35];
  const tiersNumbers = [5, 8, 10, 11, 13, 23, 24, 16, 30, 33, 27, 36];
  const orphelinsNumbers = [1, 6, 9, 14, 17, 20, 31, 34];

  const lowNumbers = Array.from({ length: 18 }, (_, i) => i + 1);
  const highNumbers = Array.from({ length: 18 }, (_, i) => i + 19);

  useEffect(() => {
    const ws = new WebSocket('wss://dga.pragmaticplaylive.net/ws');

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      
      const request = {
        type: 'subscribe',
        casinoId: 'ppcdk00000005349',
        currency: 'BRL',
        key: [230]
      };
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.last20Results && data.last20Results.length > 0) {
          const newResult = {
            result: data.last20Results[0].result,
            time: data.last20Results[0].time
          };
          
          setResults(prev => {
            if (prev.length === 0 || prev[0].time !== newResult.time) {
              return [newResult, ...prev].slice(0, 20);
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onerror = (event) => {
      setError('Connection error occurred');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const getNumberColor = (number: string) => {
    const num = parseInt(number);
    
    if (showHighLowFilter) {
      if (lowNumbers.includes(num)) return 'bg-amber-500';
      if (highNumbers.includes(num)) return 'bg-indigo-500';
      return 'bg-green-500';
    }
    
    if (showRegionFilter) {
      if (voisinsNumbers.includes(num)) return 'bg-purple-500';
      if (tiersNumbers.includes(num)) return 'bg-pink-500';
      if (orphelinsNumbers.includes(num)) return 'bg-gray-500';
      return 'bg-green-500';
    }
    
    if (showDozenFilter) {
      if (num >= 1 && num <= 12) return 'bg-blue-500';
      if (num >= 13 && num <= 24) return 'bg-yellow-500';
      if (num >= 25 && num <= 36) return 'bg-orange-500';
      return 'bg-green-500';
    }
    
    if (num === 0) return 'bg-green-500';
    if (redNumbers.includes(num)) return 'bg-red-500';
    if (blackNumbers.includes(num)) return 'bg-zinc-900';
    return 'bg-gray-500';
  };

  const addFloatingWindow = (type: 'stats' | 'hotcold' | 'race') => {
    const newWindow: FloatingWindowState = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 200, y: Math.random() * 100 },
    };
    setFloatingWindows(prev => [...prev, newWindow]);
  };

  const removeFloatingWindow = (id: string) => {
    setFloatingWindows(prev => prev.filter(window => window.id !== id));
  };

  const updateWindowPosition = (id: string, position: { x: number; y: number }) => {
    setFloatingWindows(prev =>
      prev.map(window =>
        window.id === id ? { ...window, position } : window
      )
    );
  };

  return (
    <div className="bg-zinc-800 rounded-lg shadow-xl p-3 md:p-4 border border-red-600/20">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-[1px] h-[1px] opacity-0 absolute pointer-events-none"
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-2 md:space-y-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-100">Roleta 3</h2>
          <button
            onClick={() => setShowHelp(true)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => addFloatingWindow('stats')}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => addFloatingWindow('hotcold')}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Flame className="w-4 h-4" />
          </button>
          <button
            onClick={() => addFloatingWindow('race')}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs md:text-sm text-gray-300">Filtro Dúzia</span>
            <div
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showDozenFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              onClick={() => {
                setShowDozenFilter(!showDozenFilter);
                if (!showDozenFilter) {
                  setShowRegionFilter(false);
                  setShowHighLowFilter(false);
                }
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showDozenFilter ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs md:text-sm text-gray-300">Filtro Região</span>
            <div
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showRegionFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              onClick={() => {
                setShowRegionFilter(!showRegionFilter);
                if (!showRegionFilter) {
                  setShowDozenFilter(false);
                  setShowHighLowFilter(false);
                }
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showRegionFilter ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs md:text-sm text-gray-300">Altos/Baixos</span>
            <div
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showHighLowFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              onClick={() => {
                setShowHighLowFilter(!showHighLowFilter);
                if (!showHighLowFilter) {
                  setShowDozenFilter(false);
                  setShowRegionFilter(false);
                }
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showHighLowFilter ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
          <div className="flex items-center gap-1">
            <CircleDot className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-xs md:text-sm text-gray-300">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
        {results.map((result, index) => (
          <div
            key={`${result.time}-${index}`}
            className={`${getNumberColor(result.result)} w-full aspect-square rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform hover:scale-105`}
          >
            {result.result}
          </div>
        ))}
      </div>

      {floatingWindows.map((window) => (
        <FloatingWindow
          key={window.id}
          id={window.id}
          title={
            window.type === 'stats' 
              ? 'Estatísticas dos Números' 
              : window.type === 'hotcold'
              ? 'Números Quentes e Frios'
              : 'Race Track'
          }
          position={window.position}
          onClose={() => removeFloatingWindow(window.id)}
          onDragEnd={updateWindowPosition}
        >
          {window.type === 'stats' ? (
            <div className="h-[400px]">
              <PieChart results={results.map(r => r.result)} />
            </div>
          ) : window.type === 'hotcold' ? (
            <HotColdNumbers results={results.map(r => r.result)} />
          ) : (
            <RaceTrack results={results.map(r => r.result)} />
          )}
        </FloatingWindow>
      ))}

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="modal-content rounded-lg p-4 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3 text-gray-100">Significado das Cores</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-200">Cores Padrão:</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-300">Números Vermelhos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
                    <span className="text-sm text-gray-300">Números Pretos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-300">Zero</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-200">Filtro Dúzia:</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-300">Primeira Dúzia (1-12)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-300">Segunda Dúzia (13-24)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-300">Terceira Dúzia (25-36)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-200">Filtro Região:</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-300">Voisins (2,4,7,12,3,15,19,18,21,22,25,26,28,29,32,35)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-xs text-gray-300">Tiers (5,8,10,11,13,23,24,16,30,33,27,36)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-xs text-gray-300">Órfãos (1,6,9,14,17,20,31,34)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-200">Filtro Altos/Baixos:</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-gray-300">Números Baixos (1-18)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm text-gray-300">Números Altos (19-36)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}