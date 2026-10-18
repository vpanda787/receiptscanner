import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import { addDays, daysBetween, shortDate } from "../lib/dates";

export default function Scan({ items = [], asOf, onAdded, onViewPantry }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);
  const [keep, setKeep] = useState({});
  const [replacedCount, setReplacedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const input = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function choose(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAdded(null);
    setReplacedCount(0);
    setError("");
  }

  // Scan first; only clear the old pantry once the new items are safely saved.
  async function read(replace) {
    setError("");
    const oldItems = items;
    try {
      let newItems = await api.uploadReceipt(file, setStage);
      // The scan stamps the real date; if the demo is simulated ahead, shift new items to match.
      const offset = newItems.length && asOf ? daysBetween(newItems[0].purchaseDate, asOf) : 0;
      if (offset > 0) {
        setStage("Lining up dates with the demo");
        newItems = await Promise.all(
          newItems.map((i) => api.updateItem(i.itemId, { expirationDate: addDays(i.expirationDate, offset) }))
        );
      }
      if (replace && oldItems.length) {
        setStage("Clearing your old pantry");
        const newIds = new Set(newItems.map((i) => i.itemId));
        const toRemove = oldItems.filter((i) => !newIds.has(i.itemId));
        await Promise.all(toRemove.map((i) => api.deleteItem(i.itemId)));
        setReplacedCount(toRemove.length);
      }
      setAdded(newItems);
      setKeep(Object.fromEntries(newItems.map((i) => [i.itemId, true])));
      await onAdded();
    } catch (e) {
      setError(`Couldn't read that receipt. ${e.message} Try a flatter, well-lit photo, or add items by hand from the pantry.`);
    } finally {
      setStage("");
    }
  }

  const unchecked = added ? added.filter((i) => !keep[i.itemId]) : [];

  // Delete anything the user unchecked, then go to the pantry.
  async function finish() {
    if (unchecked.length) {
      setSaving(true);
      try {
        await Promise.all(unchecked.map((i) => api.deleteItem(i.itemId)));
        await onAdded();
      } catch (e) {
        setError(`Couldn't remove some items. ${e.message}`);
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    onViewPantry();
  }

  const busy = Boolean(stage);

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

      {file && !added && (
        <>
          {items.length > 0 && (
            <p className="hint">
              Your pantry has {items.length} item{items.length === 1 ? "" : "s"}. Replace keeps only this receipt; add keeps everything.
            </p>
          )}
          <div className="actions">
            <button className="btn btn-quiet" onClick={() => input.current.click()} disabled={busy}>Choose another photo</button>
            {items.length > 0 ? (
              <>
                <button className="btn" onClick={() => read(false)} disabled={busy}>Add to my pantry</button>
                <button className="btn btn-primary" onClick={() => read(true)} disabled={busy}>Replace my pantry</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => read(false)} disabled={busy}>Read receipt</button>
            )}
          </div>
          {busy && <p className="muted scan-status" aria-live="polite">{stage}…</p>}
        </>
      )}

      {error && <p className="notice notice-error" role="alert">{error}</p>}

      {added && (
        <div className="results">
          <h3 className="subhead">Added {added.length} item{added.length === 1 ? "" : "s"}</h3>
          {replacedCount > 0 && <p className="muted">Removed {replacedCount} old item{replacedCount === 1 ? "" : "s"} from your pantry.</p>}
          <p className="muted">Uncheck anything you don't want, like bags or non-food items.</p>
          <ul className="parsed">
            {added.map((i) => (
              <li key={i.itemId}>
                <label className={`parsed-row ${keep[i.itemId] ? "" : "off"}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(keep[i.itemId])}
                    onChange={(e) => setKeep((k) => ({ ...k, [i.itemId]: e.target.checked }))}
                  />
                  <span className="raw">{i.rawText}</span>
                  <span className="parsed-name">{i.name}</span>
                  <span className="muted">expires {shortDate(i.expirationDate)}</span>
                </label>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary" onClick={finish} disabled={saving}>
            {saving
              ? "Removing…"
              : unchecked.length
                ? `Remove ${unchecked.length} and view pantry`
                : "View pantry"}
          </button>
        </div>
      )}
    </section>
  );
}
