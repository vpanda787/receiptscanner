// Speak text with Polly (via the backend /speak endpoint), falling back to browser speech.
import { speak as fetchPollyAudio } from "../api";

let audioEl = null;
let token = 0; // ignores stale requests when the user taps Next quickly
let speaking = false;

export const isSpeaking = () => speaking;

export function stopSpeaking() {
  token++;
  speaking = false;
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export async function speakText(text, { onStart, onEnd } = {}) {
  stopSpeaking();
  const mine = ++token;
  const finish = () => {
    if (mine !== token) return;
    speaking = false;
    onEnd?.();
  };

  speaking = true;
  onStart?.();

  try {
    const b64 = await fetchPollyAudio(text);
    if (mine !== token) return;
    if (b64) {
      audioEl = new Audio(`data:audio/mpeg;base64,${b64}`);
      audioEl.onended = finish;
      audioEl.onerror = finish;
      await audioEl.play();
      return;
    }
  } catch (err) {
    console.warn("Polly unavailable, using browser speech:", err.message);
    if (mine !== token) return;
  }

  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.speak(u);
  } else {
    finish();
  }
}
