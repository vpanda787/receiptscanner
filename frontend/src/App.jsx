import { useCallback, useEffect, useState } from "react";
import { APP_NAME, USE_MOCK } from "./config";
import * as api from "./api";
import { todayISO } from "./lib/dates";
import Pantry from "./components/Pantry";
import Scan from "./components/Scan";
import Cook from "./components/Cook";
import CookMode from "./components/CookMode";

const TABS = [
  ["pantry", "Pantry"],
  ["scan", "Scan"],
  ["cook", "Cook"],
];

export default function App() {
  const [tab, setTab] = useState("pantry");
  const [items, setItems] = useState([]);
  const [asOf, setAsOf] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [cooking, setCooking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError("");
      const data = await api.listInventory();
      setItems(data.items);
      if (data.asOf) setAsOf(data.asOf);
    } catch (e) {
      setError(`Couldn't load the pantry. ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="app">
      <header className="masthead">
        <h1 className="brand">{APP_NAME}</h1>
        {USE_MOCK && <span className="badge" title="VITE_API_BASE is not set">Mock data</span>}
        <nav className="tabs" aria-label="Sections">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className="tab"
              aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {error && (
          <div className="notice notice-error" role="alert">
            {error} <button className="link" onClick={refresh}>Try again</button>
          </div>
        )}

        {tab === "pantry" && (
          <Pantry items={items} asOf={asOf} loading={loading} onChange={refresh} onToast={setToast} onGoScan={() => setTab("scan")} />
        )}
        {tab === "scan" && (
          <Scan onAdded={refresh} onViewPantry={() => setTab("pantry")} />
        )}
        {tab === "cook" && (
          <Cook items={items} asOf={asOf} recipe={recipe} setRecipe={setRecipe} onStart={() => setCooking(true)} />
        )}
      </main>

      {cooking && recipe && <CookMode recipe={recipe} onClose={() => setCooking(false)} />}

      <div className="toast-region" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
