import { SOON_DAYS } from "../config";
import { freshness, shortDate } from "../lib/dates";

export default function ItemRow({ item, asOf, onSelect }) {
  const f = freshness(item, asOf, SOON_DAYS);
  const qty = [item.quantity, item.unit].filter(Boolean).join(" ");
  return (
    <li className={`row level-${f.level}`}>
      <button className="row-button" onClick={onSelect} aria-label={`Edit ${item.name}, ${f.label}`}>
        <span className="row-main">
          <span className="row-name">{item.name}</span>
          <span className="row-meta">{qty ? `${qty}, ` : ""}{item.category}</span>
        </span>
        <span className="row-when">
          <span className="row-label">{f.label}</span>
          <span className="row-date">{shortDate(item.expirationDate)}</span>
        </span>
        <span className="gauge" aria-hidden="true">
          <span className="gauge-fill" style={{ inlineSize: `${Math.round(f.remaining * 100)}%` }} />
        </span>
      </button>
    </li>
  );
}
