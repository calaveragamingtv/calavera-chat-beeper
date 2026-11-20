
let socket = null;
let retryTimer = null;
let reconnectAttempts = 0;
let manuallyDisconnected = false;

let messageHandler = null;
let statusHandler = null;

const RECONNECT_DELAYS = [
  2000,
  4000,
  8000,
  16000,
  30000
];

function createConnection() {
  if (manuallyDisconnected) return;

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
     socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const protocol =
    location.protocol === "https:" ? "wss:" : "ws:";

  const ws = new WebSocket(
    `${protocol}//${location.host}/ws`
  );

  socket = ws;

  ws.onopen = () => {
    if (socket !== ws) return;

    reconnectAttempts = 0;

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    statusHandler?.("Conectado");
  };

  ws.onmessage = (event) => {
    if (socket !== ws) return;

    try {
      const data = JSON.parse(event.data);
      messageHandler?.(data);
    } catch (error) {
      console.error("Mensaje inválido:", error);
    }
  };

  ws.onclose = () => {
    if (socket !== ws) return;

    socket = null;

    if (manuallyDisconnected) return;

    statusHandler?.("Desconectado");

    scheduleReconnect();
  };

  ws.onerror = () => {
    if (socket !== ws) return;

    statusHandler?.("Error de conexión");
  };
}

function scheduleReconnect() {
  if (manuallyDisconnected || retryTimer) return;

  const index = Math.min(
    reconnectAttempts,
    RECONNECT_DELAYS.length - 1
  );

  const delay = RECONNECT_DELAYS[index];

  reconnectAttempts++;

  statusHandler?.("Reconectando...");

  console.log(
    `WebSocket: nuevo intento en ${delay / 1000} segundos`
  );

  retryTimer = setTimeout(() => {
    retryTimer = null;
    createConnection();
  }, delay);
}

export function connectWebSocket(onMessage, onStatus) {
  messageHandler = onMessage;
  statusHandler = onStatus;

  manuallyDisconnected = false;

  if (retryTimer) return;

  createConnection();
}

export function disconnectWebSocket() {
  manuallyDisconnected = true;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  if (socket) {
    const currentSocket = socket;
    socket = null;
    currentSocket.close();
  }

  reconnectAttempts = 0;

  statusHandler?.("Desconectado");
}

export function sendMessage(data) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}
