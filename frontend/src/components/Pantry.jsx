import { useState } from "react";
import * as api from "../api";
import { SOON_DAYS } from "../config";
import { freshness } from "../lib/dates";
import ItemRow from "./ItemRow";
import ItemEditor from "./ItemEditor";

export default function Pantry({ items, asOf, loading, onChange, onToast, onGoScan }) {
  const [editing, setEditing] = useState(null); // item, "new", or null
  const [simulating, setSimulating] = useState(false);

  const soon = items.filter((i) => {
    const f = freshness(i, asOf, SOON_DAYS);
    return f.left >= 0 && f.left <= SOON_DAYS;
  });

  async function simulate() {
    setSimulating(true);
    try {
      await api.simulateDays(3);
      await onChange();
      const res = await api.checkNotifications();
      onToast(
        res.expiringCount > 0
          ? `3 days later: ${res.expiringCount} item${res.expiringCount === 1 ? "" : "s"} expiring soon${res.emailed ? " — alert email sent" : ""}.`
          : "3 days later: nothing expires in the next 2 days."
      );
    } catch (e) {
      onToast(`Simulation failed. ${e.message}`);
    } finally {
      setSimulating(false);
    }
  }

  async function reset() {
    await api.resetDemo();
    await onChange();
    onToast("Demo pantry restored.");
  }

  if (loading) return <p className="muted">Loading your pantry…</p>;

  return (
    <section>
      <div className="section-head">
        <div>
          <h2 className="headline">
            {items.length === 0
              ? "Your pantry is empty"
              : soon.length === 0
                ? "Nothing needs using up right now"
                : `Use ${soon.length} item${soon.length === 1 ? "" : "s"} in the next ${SOON_DAYS} days`}
          </h2>
          <p className="muted">Sorted by what expires first.</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setEditing("new")}>Add item</button>
          <button className="btn btn-quiet" onClick={simulate} disabled={simulating}>
            {simulating ? "Simulating…" : "Simulate 3 days later"}
          </button>
          <button className="btn btn-quiet" onClick={reset}>Reset demo</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>Scan a grocery receipt to fill your pantry, or add items by hand.</p>
          <button className="btn btn-primary" onClick={onGoScan}>Scan a receipt</button>
        </div>
      ) : (
        <ul className="shelf">
          {items.map((item) => (
            <ItemRow key={item.itemId} item={item} asOf={asOf} onSelect={() => setEditing(item)} />
          ))}
        </ul>
      )}

      {editing && (
        <ItemEditor
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => { setEditing(null); await onChange(); onToast(msg); }}
        />
      )}
    </section>
  );
}
