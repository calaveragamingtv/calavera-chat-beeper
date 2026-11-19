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

    // Twitch EventSub endpoint
    if (url.pathname === "/webhooks/twitch" && request.method === "POST") {
      return handleTwitchWebhook(request, env);
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

async function handleTwitchWebhook(request, env) {
  const messageType = request.headers.get(
    "Twitch-Eventsub-Message-Type"
  );

  const body = await request.text();

  // Subscription verification
  if (messageType === "webhook_callback_verification") {
    const data = JSON.parse(body);

    return new Response(data.challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }

  // Notifications
  if (messageType === "notification") {
    const data = JSON.parse(body);

    if (data.subscription?.type === "channel.chat.message") {
      const message = data.event?.message?.text;

      if (message) {
        const id = env.CHAT_ROOM.idFromName("main");
        const room = env.CHAT_ROOM.get(id);

        await room.broadcast({
          type: "chat_message",
          platform: "twitch",
          message
        });
      }
    }

    return new Response("OK", { status: 200 });
  }

  // Revocation
  if (messageType === "revocation") {
    console.log("Twitch subscription revoked:", body);
    return new Response("OK", { status: 200 });
  }

  return new Response("Unsupported EventSub message", {
    status: 400
  });
}
