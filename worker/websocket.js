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

  webSocketClose(ws, code, reason, wasClean) {
    ws.close(code, reason);
  }

  webSocketError(ws, error) {
    console.error("WebSocket error:", error);
  }
}
