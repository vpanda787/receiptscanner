// Optional hands-free commands using the browser's built-in speech recognition.
import { isSpeaking } from "./speak";

const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const voiceCommandsSupported = Boolean(Recognition);

const PATTERNS = [
  ["next", /\b(next|continue|done|go on)\b/],
  ["back", /\b(back|previous|go back)\b/],
  ["repeat", /\b(repeat|again|say that again|what)\b/],
  ["stop", /\b(stop|pause|quiet)\b/],
];

export function createCommandListener(onCommand) {
  if (!Recognition) return { start() {}, stop() {}, supported: false };
  let active = false;
  const rec = new Recognition();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-US";

  rec.onresult = (e) => {
    if (isSpeaking()) return; // don't react to our own voice
    const said = e.results[e.results.length - 1][0].transcript.toLowerCase();
    const hit = PATTERNS.find(([, re]) => re.test(said));
    if (hit) onCommand(hit[0], said);
  };
  rec.onend = () => {
    if (active) {
      try { rec.start(); } catch { /* already starting */ }
    }
  };
  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      active = false;
      onCommand("denied");
    }
  };

  return {
    supported: true,
    start() { active = true; try { rec.start(); } catch { /* already running */ } },
    stop() { active = false; rec.stop(); },
  };
}
