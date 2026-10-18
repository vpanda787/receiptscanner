import { useState } from "react";
import * as api from "../api";
import { SOON_DAYS } from "../config";
import { freshness } from "../lib/dates";

export default function Cook({ items, asOf, recipe, setRecipe, onStart }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upcoming = items
    .map((i) => ({ item: i, f: freshness(i, asOf, SOON_DAYS) }))
    .filter(({ f }) => f.left >= 0)
    .slice(0, 4);

  async function make() {
    setBusy(true);
    setError("");
    try {
      setRecipe(await api.generateRecipe());
    } catch (e) {
      setError(`Couldn't make a recipe. ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const byId = Object.fromEntries(items.map((i) => [i.itemId, i]));
  const usedUp = recipe ? recipe.usesItemIds.map((id) => byId[id]).filter(Boolean) : [];

  if (!recipe) {
    return (
      <section>
        <h2 className="headline">Cook what expires first</h2>
        <p className="muted">A recipe built around these, starting with the soonest:</p>
        {upcoming.length === 0 ? (
          <p className="empty">Nothing in your pantry yet. Scan a receipt first.</p>
        ) : (
          <ul className="chips">
            {upcoming.map(({ item, f }) => (
              <li key={item.itemId} className={`chip level-${f.level}`}>{item.name}<span>{f.label}</span></li>
            ))}
          </ul>
        )}
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-large" onClick={make} disabled={busy || upcoming.length === 0}>
          {busy ? "Writing your recipe…" : "Make a recipe"}
        </button>
      </section>
    );
  }

  return (
    <section className="recipe">
      <h2 className="headline">{recipe.title}</h2>
      <p className="muted">
        {[recipe.servings && `Serves ${recipe.servings}`, recipe.timeMinutes && `${recipe.timeMinutes} minutes`].filter(Boolean).join(", ")}
      </p>

      {usedUp.length > 0 && (
        <>
          <h3 className="subhead">Uses up</h3>
          <ul className="chips">
            {usedUp.map((i) => {
              const f = freshness(i, asOf, SOON_DAYS);
              return <li key={i.itemId} className={`chip level-${f.level}`}>{i.name}<span>{f.label}</span></li>;
            })}
          </ul>
        </>
      )}

      <div className="recipe-cols">
        <div>
          <h3 className="subhead">Ingredients</h3>
          <ul className="ingredients">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className={ing.itemId ? "from-pantry" : ""}>
                <span>{ing.name}</span>
                {ing.amount && <span className="muted">{ing.amount}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="subhead">Steps</h3>
          <ol className="steps">
            {recipe.steps.map((s, idx) => <li key={idx}>{s}</li>)}
          </ol>
        </div>
      </div>

      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <div className="actions">
        <button className="btn btn-primary btn-large" onClick={onStart}>Start cooking</button>
        <button className="btn btn-quiet" onClick={make} disabled={busy}>{busy ? "Writing…" : "Try another recipe"}</button>
      </div>
    </section>
  );
}
