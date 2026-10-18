import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import { CATEGORIES } from "../config";

export default function ItemEditor({ item, onClose, onSaved }) {
  const isNew = !item;
  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [category, setCategory] = useState(item?.category ?? "produce");
  const [expirationDate, setExpirationDate] = useState(item?.expirationDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const firstField = useRef(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Give the item a name.");
    setBusy(true);
    setError("");
    try {
      const fields = { name: name.trim(), quantity: Number(quantity) || 1, unit: unit.trim(), category };
      if (isNew) {
        await api.addItem(fields);
        onSaved(`Added ${fields.name}.`);
      } else {
        await api.updateItem(item.itemId, expirationDate ? { ...fields, expirationDate } : fields);
        onSaved(`Saved ${fields.name}.`);
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.deleteItem(item.itemId);
      onSaved(`Removed ${item.name}.`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const n = item?.nutrition;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="editor-title" onSubmit={save}>
        <h2 id="editor-title" className="sheet-title">{isNew ? "Add an item" : `Edit ${item.name}`}</h2>
        {item?.rawText && <p className="muted">On the receipt as “{item.rawText}”</p>}

        <label className="field">
          <span>Name</span>
          <input ref={firstField} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Quantity</span>
            <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label className="field">
            <span>Unit</span>
            <input value={unit} placeholder="lb, bag, oz…" onChange={(e) => setUnit(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {isNew ? (
          <p className="hint">We'll estimate the expiration date from typical shelf life. You can change it after adding.</p>
        ) : (
          <label className="field">
            <span>Expiration date</span>
            <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
            <small className="hint">Estimated from typical shelf life. Check the package and trust your senses, and change it if it's wrong.</small>
          </label>
        )}

        {n && (
          <dl className="nutrition">
            <div><dt>Calories</dt><dd>{n.calories}</dd></div>
            <div><dt>Protein</dt><dd>{n.protein_g} g</dd></div>
            <div><dt>Carbs</dt><dd>{n.carbs_g} g</dd></div>
            <div><dt>Fat</dt><dd>{n.fat_g} g</dd></div>
            <p className="muted nutrition-per">Per {n.per}</p>
          </dl>
        )}

        {error && <p className="notice notice-error" role="alert">{error}</p>}

        <div className="sheet-actions">
          {!isNew && <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>Remove</button>}
          <span className="spacer" />
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{isNew ? "Add item" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
