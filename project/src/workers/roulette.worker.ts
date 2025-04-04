// SharedWorker para gerenciar conexões WebSocket
let ws: WebSocket | null = null;
const ports: Set<MessagePort> = new Set();

const connectWebSocket = () => {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket('wss://dga.pragmaticplaylive.net/ws');

  ws.onopen = () => {
    console.log('[SharedWorker] WebSocket conectado');
    broadcast({ type: 'connection', status: 'connected' });
  };

  ws.onclose = () => {
    console.log('[SharedWorker] WebSocket desconectado');
    broadcast({ type: 'connection', status: 'disconnected' });
    // Tentar reconectar após 1 segundo
    setTimeout(connectWebSocket, 1000);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      broadcast({ type: 'message', data });
    } catch (err) {
      console.error('[SharedWorker] Erro ao processar mensagem:', err);
    }
  };
};

const broadcast = (message: any) => {
  ports.forEach(port => port.postMessage(message));
};

self.onconnect = (event) => {
  const port = event.ports[0];
  ports.add(port);

  port.onmessage = (event) => {
    const { type, data } = event.data;

    if (type === 'subscribe') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }
  };

  port.start();

  // Iniciar conexão WebSocket se ainda não existir
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    connectWebSocket();
  }
};