import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import { shortDate } from "../lib/dates";

export default function Scan({ onAdded, onViewPantry }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);
  const input = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function choose(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAdded(null);
    setError("");
  }

  async function read() {
    setError("");
    try {
      const items = await api.uploadReceipt(file, setStage);
      setAdded(items);
      await onAdded();
    } catch (e) {
      setError(`Couldn't read that receipt. ${e.message} Try a flatter, well-lit photo, or add items by hand from the pantry.`);
    } finally {
      setStage("");
    }
  }

  return (
    <section className="scan">
      <h2 className="headline">Scan a grocery receipt</h2>
      <p className="muted">Take a photo of the whole receipt. Items and expiration dates go straight into your pantry.</p>

      <input ref={input} type="file" accept="image/*" capture="environment" onChange={choose} hidden />

      <div className="scan-stage">
        {preview ? (
          <img className="receipt-preview" src={preview} alt="Receipt to read" />
        ) : (
          <button className="drop" onClick={() => input.current.click()}>
            <span className="drop-title">Take or choose a photo</span>
            <span className="muted">JPEG or PNG, any size</span>
          </button>
        )}
      </div>

      <div className="actions">
        {preview && <button className="btn btn-quiet" onClick={() => input.current.click()} disabled={!!stage}>Choose another photo</button>}
        {file && !added && (
          <button className="btn btn-primary" onClick={read} disabled={!!stage}>
            {stage ? `${stage}…` : "Read receipt"}
          </button>
        )}
      </div>

      {error && <p className="notice notice-error" role="alert">{error}</p>}

      {added && (
        <div className="results">
          <h3 className="subhead">Added {added.length} item{added.length === 1 ? "" : "s"}</h3>
          <ul className="parsed">
            {added.map((i) => (
              <li key={i.itemId}>
                <span className="raw">{i.rawText}</span>
                <span className="parsed-name">{i.name}</span>
                <span className="muted">expires {shortDate(i.expirationDate)}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary" onClick={onViewPantry}>View pantry</button>
        </div>
      )}
    </section>
  );
}
