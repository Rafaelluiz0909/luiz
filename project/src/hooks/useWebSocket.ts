import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  maxRetries?: number;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxRetries = options.maxRetries || 10;
  const heartbeatInterval = useRef<number>();
  const reconnectTimeout = useRef<number>();

  // Função para calcular delay de reconexão com backoff exponencial
  const getReconnectDelay = useCallback(() => {
    return Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
  }, []);

  // Função para enviar heartbeat
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Função principal de conexão
  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket já está conectado');
        return;
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        options.onConnect?.();

        // Iniciar heartbeat
        heartbeatInterval.current = window.setInterval(sendHeartbeat, 30000);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket desconectado');
        setIsConnected(false);
        options.onDisconnect?.();
        clearInterval(heartbeatInterval.current);

        // Tentar reconectar se autoReconnect estiver ativado
        if (options.autoReconnect !== false && reconnectAttempts.current < maxRetries) {
          const delay = getReconnectDelay();
          console.log(`Tentando reconectar em ${delay}ms (tentativa ${reconnectAttempts.current + 1})`);
          reconnectTimeout.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('Erro no WebSocket:', event);
        setError('Erro de conexão');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Se for uma mensagem de pong, ignorar
          if (data.type === 'pong') return;
          options.onMessage?.(data);
        } catch (err) {
          console.error('Erro ao processar mensagem:', err);
        }
      };
    } catch (err) {
      console.error('Erro ao criar WebSocket:', err);
      setError('Erro ao criar conexão');
    }
  }, [url, options, getReconnectDelay, sendHeartbeat, maxRetries]);

  // Reconectar quando a aba voltar a ficar ativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Aba ativa, verificando conexão');
        if (!isConnected) {
          console.log('Reconectando após aba ficar ativa');
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, isConnected]);

  // Conectar ao montar e limpar ao desmontar
  useEffect(() => {
    connect();

    return () => {
      clearInterval(heartbeatInterval.current);
      clearTimeout(reconnectTimeout.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Função para enviar mensagens
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está conectado');
    }
  }, []);

  return {
    isConnected,
    error,
    sendMessage
  };
}