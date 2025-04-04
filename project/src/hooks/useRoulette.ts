import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface RouletteResult {
  result: string;
  time: string;
}

export function useRoulette(casinoId: string, key: number) {
  const [results, setResults] = useState<RouletteResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((data: any) => {
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
  }, []);

  const { isConnected, sendMessage } = useWebSocket('wss://dga.pragmaticplaylive.net/ws', {
    onConnect: () => {
      const request = {
        type: 'subscribe',
        casinoId,
        currency: 'BRL',
        key: [key]
      };
      sendMessage(request);
    },
    onMessage: handleMessage,
    onDisconnect: () => setError('Desconectado'),
    autoReconnect: true,
    maxRetries: Infinity // Tentar reconectar indefinidamente
  });

  return {
    results,
    isConnected,
    error
  };
}