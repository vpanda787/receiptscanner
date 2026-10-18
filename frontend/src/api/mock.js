// In-memory fake backend that follows docs/API_CONTRACT.md. Used when VITE_API_BASE is unset.
import { addDays, daysBetween, todayISO } from "../lib/dates";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SHELF_DAYS = { produce: 5, dairy: 10, meat: 3, seafood: 2, bakery: 5, pantry: 180, frozen: 90, other: 7 };
let nextId = 100;
const id = () => `itm_${nextId++}`;

const realToday = new Date().toISOString().slice(0, 10);
let offsetDays = 0;
const asOf = () => addDays(realToday, offsetDays);

// [name, rawText, qty, unit, category, boughtDaysAgo, expiresInDays, nutrition]
const SEED = [
  ["Baby spinach", "TJ BABY SPNCH 5OZ", 1, "bag", "produce", 4, 1, { per: "100 g", calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4 }],
  ["Chicken breast", "GV ORG BNLS CHKN", 1.5, "lb", "meat", 1, 2, { per: "100 g", calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 }],
  ["Cilantro", "CILANTRO BNCH", 1, "bunch", "produce", 4, 2, { per: "100 g", calories: 23, protein_g: 2.1, carbs_g: 3.7, fat_g: 0.5 }],
  ["Greek yogurt", "FAGE 2% PLN 17OZ", 1, "tub", "dairy", 6, 4, { per: "170 g", calories: 150, protein_g: 20, carbs_g: 6, fat_g: 4 }],
  ["Strawberries", "STRWBRY 1LB CLAM", 1, "lb", "produce", 2, 3, { per: "100 g", calories: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3 }],
  ["Red bell peppers", "PEPPER RED BELL", 3, "", "produce", 2, 6, { per: "100 g", calories: 31, protein_g: 1, carbs_g: 6, fat_g: 0.3 }],
  ["Flour tortillas", "MSN FLR TORT 10CT", 10, "", "bakery", 2, 8, null],
  ["Eggs", "GV LG EGGS 12CT", 12, "", "dairy", 3, 18, { per: "1 egg", calories: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8 }],
  ["Cheddar cheese", "TILLAMK MED CHDR", 8, "oz", "dairy", 3, 24, { per: "28 g", calories: 110, protein_g: 7, carbs_g: 0, fat_g: 9 }],
  ["Jasmine rice", "JASMINE RICE 2LB", 2, "lb", "pantry", 3, 360, null],
];

let store = [];
function seed() {
  offsetDays = 0;
  store = SEED.map(([name, rawText, quantity, unit, category, ago, left, nutrition]) => ({
    itemId: id(), name, rawText, quantity, unit, category,
    purchaseDate: addDays(realToday, -ago),
    expirationDate: addDays(realToday, left),
    edited: false, nutrition,
  }));
}
seed();

const sorted = () => [...store].sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));

export async function listInventory() {
  await wait(250);
  return { asOf: asOf(), items: sorted() };
}

export async function addItem({ name, quantity = 1, unit = "", category = "other" }) {
  await wait(200);
  const item = {
    itemId: id(), name, rawText: "", quantity: Number(quantity), unit, category,
    purchaseDate: asOf(), expirationDate: addDays(asOf(), SHELF_DAYS[category] ?? 7),
    edited: true, nutrition: null,
  };
  store.push(item);
  return { item };
}

export async function updateItem(itemId, patch) {
  await wait(150);
  const item = store.find((i) => i.itemId === itemId);
  if (!item) throw new Error("That item no longer exists. Refresh the pantry.");
  Object.assign(item, patch, { edited: true });
  return { item };
}

export async function deleteItem(itemId) {
  await wait(150);
  store = store.filter((i) => i.itemId !== itemId);
}

export async function processReceipt() {
  await wait(1800);
  const parsed = [
    ["Avocados", "HASS AVO 4CT BAG", 4, "", "produce", 4],
    ["Whole milk", "DARIGOLD WHL MLK GAL", 1, "gal", "dairy", 7],
    ["Ground turkey", "JENNIE-O GRD TRKY 93", 1, "lb", "meat", 2],
    ["Sourdough bread", "SAN FRAN SRDGH LOAF", 1, "loaf", "bakery", 5],
  ].map(([name, rawText, quantity, unit, category, days]) => ({
    itemId: id(), name, rawText, quantity, unit, category,
    purchaseDate: realToday, expirationDate: addDays(realToday, days), edited: false, nutrition: null,
  }));
  store.push(...parsed);
  return { items: parsed };
}

export async function generateRecipe() {
  await wait(1400);
  const soonest = sorted().filter((i) => daysBetween(asOf(), i.expirationDate) >= 0).slice(0, 4);
  const find = (word) => store.find((i) => i.name.toLowerCase().includes(word));
  const spinach = find("spinach"), chicken = find("chicken"), cilantro = find("cilantro"), yogurt = find("yogurt");
  return {
    recipe: {
      recipeId: `rcp_${Date.now()}`,
      title: "Chicken and spinach quesadillas with cilantro yogurt",
      servings: 2,
      timeMinutes: 25,
      usesItemIds: soonest.map((i) => i.itemId),
      ingredients: [
        { name: "Chicken breast", amount: "1 lb", itemId: chicken?.itemId },
        { name: "Baby spinach", amount: "3 handfuls", itemId: spinach?.itemId },
        { name: "Flour tortillas", amount: "4", itemId: find("tortilla")?.itemId },
        { name: "Cheddar cheese", amount: "1 cup, shredded", itemId: find("cheddar")?.itemId },
        { name: "Greek yogurt", amount: "1/2 cup", itemId: yogurt?.itemId },
        { name: "Cilantro", amount: "1 small bunch", itemId: cilantro?.itemId },
        { name: "Lime", amount: "1" },
        { name: "Olive oil, salt, cumin", amount: "to taste" },
      ],
      steps: [
        "Slice the chicken breast into thin strips and season with salt and a pinch of cumin.",
        "Heat a tablespoon of olive oil in a large pan over medium-high heat.",
        "Cook the chicken for six to eight minutes, turning once, until no pink remains.",
        "Add the spinach to the pan and stir until it wilts, about one minute. Move everything to a plate.",
        "Chop the cilantro and stir it into the yogurt with a squeeze of lime and a pinch of salt.",
        "Lay a tortilla in the pan, cover half with cheese, chicken, and spinach, then fold it over.",
        "Cook two to three minutes per side until golden and the cheese melts. Repeat with the rest.",
        "Cut each quesadilla into wedges and serve with the cilantro yogurt.",
      ],
    },
  };
}

export async function checkNotifications() {
  await wait(500);
  const items = sorted().filter((i) => {
    const left = daysBetween(asOf(), i.expirationDate);
    return left >= 0 && left <= 2;
  });
  return { expiringCount: items.length, emailed: items.length > 0, items };
}

export async function simulateDays(days) {
  await wait(200);
  offsetDays = Number(days);
  return { offsetDays, asOf: asOf() };
}

export async function resetDemo() {
  await wait(200);
  seed();
  return { ok: true };
}
