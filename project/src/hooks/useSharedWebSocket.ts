import { useState, useEffect, useCallback } from 'react';

interface UseSharedWebSocketOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSharedWebSocket(options: UseSharedWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [worker, setWorker] = useState<SharedWorker | null>(null);

  useEffect(() => {
    const sharedWorker = new SharedWorker(
      new URL('../workers/roulette.worker.ts', import.meta.url),
      { type: 'module' }
    );

    setWorker(sharedWorker);

    sharedWorker.port.onmessage = (event) => {
      const { type, status, data } = event.data;

      if (type === 'connection') {
        setIsConnected(status === 'connected');
        if (status === 'connected') {
          options.onConnect?.();
        } else {
          options.onDisconnect?.();
        }
      } else if (type === 'message') {
        options.onMessage?.(data);
      }
    };

    sharedWorker.port.start();

    return () => {
      sharedWorker.port.close();
    };
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (worker) {
      worker.port.postMessage({
        type: 'subscribe',
        data: message
      });
    }
  }, [worker]);

  return {
    isConnected,
    sendMessage
  };
}