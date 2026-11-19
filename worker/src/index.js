import { ChatRoom } from "./websocket.js";

export { ChatRoom };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        app: "Calavera Chat Beeper",
        version: "1.0.0"
      });
    }

    // WebSocket connection
    if (url.pathname === "/ws") {
      const id = env.CHAT_ROOM.idFromName("main");
      const room = env.CHAT_ROOM.get(id);

      return room.fetch(request);
    }

    // Frontend
    return env.ASSETS.fetch(request);
  }
};
