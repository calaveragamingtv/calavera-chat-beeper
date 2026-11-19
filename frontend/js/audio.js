let audioContext = null;
let audioEnabled = false;
let volume = 0.7;

export async function enableAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  audioEnabled = true;
}

export function disableAudio() {
  audioEnabled = false;
}

export function setVolume(value) {
  volume = Math.max(0, Math.min(1, value));
}

export function playBeep() {
  if (!audioEnabled || !audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;

  gain.gain.setValueAtTime(
    Math.max(0.0001, volume * 0.15),
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.15
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.15);
}
