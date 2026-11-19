import {
  enableAudio,
  disableAudio,
  playBeep,
  setVolume
} from "./audio.js";

import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage
} from "./websocket.js";

const connectButton = document.getElementById("connectButton");
const audioButton = document.getElementById("audioButton");
const testButton = document.getElementById("testButton");
const volumeInput = document.getElementById("volume");

const connectionStatus = document.getElementById("connectionStatus");
const audioStatus = document.getElementById("audioStatus");
const volumeValue = document.getElementById("volumeValue");
const activity = document.getElementById("activity");

let connected = false;
let audioEnabled = false;

function log(message) {
  const entry = document.createElement("div");
  entry.className = "message";
  entry.textContent = message;

  activity.prepend(entry);

  while (activity.children.length > 10) {
    activity.lastElementChild.remove();
  }
}

function updateConnection(status) {
  connectionStatus.textContent = status;

  connected = status === "Conectado";

  connectionStatus.classList.toggle(
    "connected",
    connected
  );

  connectButton.textContent = connected
    ? "DESCONECTAR"
    : "CONECTAR";

  testButton.disabled = !connected;
}

connectButton.addEventListener("click", () => {
  if (connected) {
    disconnectWebSocket();
    updateConnection("Desconectado");
    return;
  }

  connectWebSocket((data) => {
    if (data.type === "connected") {
      log("Conexión establecida correctamente.");
    }

    if (data.type === "test_message") {
      playBeep();
      log("Beep de prueba recibido.");
    }
  }, updateConnection);
});

audioButton.addEventListener("click", async () => {
  if (audioEnabled) {
    disableAudio();
    audioEnabled = false;
  } else {
    try {
      await enableAudio();
      audioEnabled = true;
    } catch (error) {
      log("No se pudo activar el audio.");
      return;
    }
  }

  audioStatus.textContent = audioEnabled
    ? "Activadas"
    : "Desactivadas";

  audioButton.textContent = audioEnabled
    ? "DESACTIVAR SONIDO"
    : "ACTIVAR SONIDO";
});

volumeInput.addEventListener("input", () => {
  const value = Number(volumeInput.value);

  volumeValue.textContent = `${value}%`;
  setVolume(value / 100);
});

testButton.addEventListener("click", () => {
  sendMessage({
    type: "test"
  });
});

setVolume(0.7);

log("Aplicación iniciada.");
