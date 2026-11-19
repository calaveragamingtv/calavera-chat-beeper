export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        app: "Calavera Chat Beeper",
        version: "1.0.0"
      });
    }

    return env.ASSETS.fetch(request);
  }
};

