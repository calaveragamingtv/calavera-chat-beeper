import { DurableObject } from "cloudflare:workers";

export class ChatRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket upgrade required", {
        status: 426
      });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);

    server.send(JSON.stringify({
      type: "connected",
      message: "Calavera Chat Beeper conectado"
    }));

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);

      if (data.type === "test") {
        ws.send(JSON.stringify({
          type: "test_message",
          message: "Prueba de sonido"
        }));
      }
    } catch (error) {
      console.error("Error procesando mensaje:", error);
    }
  }

  webSocketClose(ws, code, reason) {
    ws.close(code, reason);
  }

  webSocketError(ws, error) {
    console.error("WebSocket error:", error);
  }
}
