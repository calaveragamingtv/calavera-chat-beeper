let socket = null;

export function connectWebSocket(onMessage, onStatus) {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
     socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const protocol =
    location.protocol === "https:" ? "wss:" : "ws:";

  socket = new WebSocket(
    `${protocol}//${location.host}/ws`
  );

  socket.onopen = () => {
    onStatus("Conectado");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Mensaje inválido:", error);
    }
  };

  socket.onclose = () => {
    onStatus("Desconectado");
  };

  socket.onerror = () => {
    onStatus("Error de conexión");
  };
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendMessage(data) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}
