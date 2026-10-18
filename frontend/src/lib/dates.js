const DAY = 24 * 60 * 60 * 1000;

// Parse "YYYY-MM-DD" as a local calendar date (avoids UTC off-by-one).
export function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function utcTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(iso, n) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(fromISO, toISO) {
  return Math.round((parseDate(toISO) - parseDate(fromISO)) / DAY);
}

export function shortDate(iso) {
  return parseDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Human label + urgency level for an item relative to "today" (asOf).
export function freshness(item, asOf, soonDays) {
  const left = daysBetween(asOf, item.expirationDate);
  const remaining = Math.min(1, Math.max(0, left / 7)); // bars use a fixed one-week scale
  let level = "fresh";
  if (left < 0) level = "expired";
  else if (left <= soonDays) level = "soon";
  else if (left <= soonDays + 3) level = "watch";

  let label;
  if (left < 0) label = left === -1 ? "Expired yesterday" : `Expired ${-left} days ago`;
  else if (left === 0) label = "Use today";
  else if (left === 1) label = "Use by tomorrow";
  else label = `${left} days left`;

  return { left, level, label, remaining };
}
