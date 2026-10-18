import { useCallback, useEffect, useRef, useState } from "react";
import { speakText, stopSpeaking } from "../voice/speak";
import { createCommandListener, voiceCommandsSupported } from "../voice/commands";

export default function CookMode({ recipe, onClose }) {
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const listener = useRef(null);
  const total = recipe.steps.length;
  const last = step === total - 1;

  const say = useCallback((i) => {
    speakText(`Step ${i + 1}. ${recipe.steps[i]}`, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  }, [recipe.steps]);

  const go = useCallback((delta) => {
    setStep((s) => Math.min(total - 1, Math.max(0, s + delta)));
  }, [total]);

  // Read each step aloud when it appears.
  useEffect(() => { say(step); }, [step, say]);

  // Clean up audio and mic when leaving cook mode.
  useEffect(() => () => { stopSpeaking(); listener.current?.stop(); }, []);

  // Keyboard: arrows to move, R to repeat, Esc to exit.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key.toLowerCase() === "r") say(step);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, say, step, onClose]);

  const stepRef = useRef(step);
  stepRef.current = step;

  function toggleMic() {
    if (listening) {
      listener.current?.stop();
      setListening(false);
      return;
    }
    listener.current = createCommandListener((cmd, said) => {
      setHeard(said ? `Heard “${said.trim()}”` : "");
      if (cmd === "next") go(1);
      else if (cmd === "back") go(-1);
      else if (cmd === "repeat") say(stepRef.current);
      else if (cmd === "stop") stopSpeaking();
      else if (cmd === "denied") { setListening(false); setHeard("Microphone access was blocked. Allow it in the browser's site settings."); }
    });
    listener.current.start();
    setListening(true);
  }

  return (
    <div className="cookmode" role="dialog" aria-modal="true" aria-label={`Cooking ${recipe.title}`}>
      <div className="cook-top">
        <span className="cook-title">{recipe.title}</span>
        <button className="btn btn-on-dark" onClick={onClose}>Exit</button>
      </div>

      <div className="cook-progress" aria-hidden="true">
        {recipe.steps.map((_, i) => <span key={i} className={i <= step ? "done" : ""} />)}
      </div>

      <div className="cook-body" aria-live="polite">
        <p className="cook-count">Step {step + 1} of {total}</p>
        <p className="cook-step">{recipe.steps[step]}</p>
        {last && <p className="cook-finish">That's the last step. Enjoy your meal.</p>}
      </div>

      <div className="cook-controls">
        <button className="btn btn-on-dark btn-large" onClick={() => go(-1)} disabled={step === 0}>Back</button>
        <button className="btn btn-on-dark btn-large" onClick={() => say(step)}>{speaking ? "Speaking…" : "Repeat"}</button>
        <button className="btn btn-cta btn-large" onClick={last ? onClose : () => go(1)}>{last ? "Finish" : "Next"}</button>
      </div>

      <div className="cook-voice">
        {voiceCommandsSupported ? (
          <>
            <button className={`mic ${listening ? "on" : ""}`} onClick={toggleMic} aria-pressed={listening}>
              {listening ? "Listening: say next, back, or repeat" : "Turn on voice commands"}
            </button>
            {heard && <span className="heard">{heard}</span>}
          </>
        ) : (
          <span className="heard">Voice commands need Chrome, Edge, or Safari. Buttons and arrow keys work everywhere.</span>
        )}
      </div>
    </div>
  );
}
