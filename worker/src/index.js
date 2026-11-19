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


async function handleTwitchWebhook(request, env) {
  const body = await request.text();

  const valid = await verifyTwitchSignature(
    request,
    body,
    env.TWITCH_EVENTSUB_SECRET
  );

  if (!valid) {
    console.log("Twitch webhook rechazado: firma inválida");
    return new Response("Invalid signature", { status: 403 });
  }

  const messageType = request.headers.get(
    "Twitch-Eventsub-Message-Type"
  );

  let data;

  try {
    data = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Subscription verification
  if (messageType === "webhook_callback_verification") {
    return new Response(data.challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }

  // Chat notifications
  if (messageType === "notification") {
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

  // Subscription revoked
  if (messageType === "revocation") {
    console.log("Twitch subscription revoked:", body);
    return new Response("OK", { status: 200 });
  }

  return new Response("Unsupported EventSub message", {
    status: 400
  });
}

async function verifyTwitchSignature(request, body, secret) {
  if (!secret) {
    console.error("Falta TWITCH_EVENTSUB_SECRET");
    return false;
  }

  const messageId = request.headers.get(
    "Twitch-Eventsub-Message-Id"
  );

  const timestamp = request.headers.get(
    "Twitch-Eventsub-Message-Timestamp"
  );

  const signature = request.headers.get(
    "Twitch-Eventsub-Message-Signature"
  );

  if (!messageId || !timestamp || !signature) {
    return false;
  }

  // Reject messages older than 10 minutes or too far in the future
  const messageTime = Date.parse(timestamp);

  if (
    !Number.isFinite(messageTime) ||
    Math.abs(Date.now() - messageTime) > 10 * 60 * 1000
  ) {
    return false;
  }

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const content = messageId + timestamp + body;

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(content)
  );

  const expectedSignature = "sha256=" +
    Array.from(new Uint8Array(signatureBytes))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < signature.length; i++) {
    difference |=
      signature.charCodeAt(i) ^
      expectedSignature.charCodeAt(i);
  }

  return difference === 0;
}

