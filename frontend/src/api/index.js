// The only place the frontend talks to the backend. Components import from here.
import { API_BASE, USE_MOCK, DEMO_USER } from "../config";
import { compressImage } from "../lib/image";
import * as mock from "./mock";

function url(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${API_BASE}${path}${sep}userId=${encodeURIComponent(DEMO_USER)}`;
}

async function http(path, { method = "GET", body } = {}) {
  const res = await fetch(url(path), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${method} ${path} returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---- Normalizers: adapt here if the real backend's field names differ from docs/API_CONTRACT.md ----
function normalizeItem(raw) {
  return {
    itemId: raw.itemId ?? raw.id,
    name: raw.name ?? raw.item ?? "Unknown item",
    rawText: raw.rawText ?? raw.raw ?? "",
    quantity: Number(raw.quantity ?? 1),
    unit: raw.unit ?? "",
    category: raw.category ?? "other",
    purchaseDate: raw.purchaseDate,
    expirationDate: raw.expirationDate,
    edited: Boolean(raw.edited),
    nutrition: raw.nutrition ?? null,
  };
}

function normalizeRecipe(raw) {
  const r = raw.recipe ?? raw;
  return {
    recipeId: r.recipeId ?? r.id ?? String(Date.now()),
    title: r.title,
    servings: r.servings ?? null,
    timeMinutes: r.timeMinutes ?? null,
    usesItemIds: r.usesItemIds ?? [],
    ingredients: (r.ingredients ?? []).map((i) => (typeof i === "string" ? { name: i } : i)),
    steps: (r.steps ?? []).map((s) => (typeof s === "string" ? s : s.text ?? String(s))),
  };
}

const byExpiration = (a, b) => a.expirationDate.localeCompare(b.expirationDate);

// ---- Public API ----
export async function listInventory() {
  const data = USE_MOCK ? await mock.listInventory() : await http("/inventory");
  const items = (data.items ?? []).map(normalizeItem).sort(byExpiration);
  return { asOf: data.asOf, items };
}

export async function addItem(fields) {
  const data = USE_MOCK ? await mock.addItem(fields) : await http("/inventory", { method: "POST", body: fields });
  return normalizeItem(data.item ?? data);
}

export async function updateItem(itemId, patch) {
  const data = USE_MOCK
    ? await mock.updateItem(itemId, patch)
    : await http(`/inventory/${encodeURIComponent(itemId)}`, { method: "PATCH", body: patch });
  return normalizeItem(data.item ?? data);
}

export async function deleteItem(itemId) {
  if (USE_MOCK) return mock.deleteItem(itemId);
  await http(`/inventory/${encodeURIComponent(itemId)}`, { method: "DELETE" });
}

// Receipt upload: one POST /receipts with the photo as base64 JSON (team decision: no presigned URLs).
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // keeps the JSON body well under the Lambda/API Gateway payload limits

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]); // strip "data:image/jpeg;base64,"
    reader.onerror = () => reject(new Error("Couldn't read the photo file."));
    reader.readAsDataURL(blob);
  });
}

export async function uploadReceipt(file, onStage = () => {}) {
  onStage("Preparing photo");
  const image = await compressImage(file);
  if (!["image/jpeg", "image/png"].includes(image.type)) {
    // e.g. an iPhone HEIC this browser couldn't convert; Textract only reads JPEG/PNG
    throw new Error("This photo format isn't supported. Take the photo in the app, or export it as JPEG.");
  }
  if (image.size > MAX_UPLOAD_BYTES) {
    throw new Error("That photo is too large to send. Use a JPEG or PNG, or take a new photo.");
  }
  if (USE_MOCK) {
    onStage("Reading receipt");
    const data = await mock.processReceipt(image);
    return data.items.map(normalizeItem);
  }
  const contentType = image.type || "image/jpeg";
  const base64 = await blobToBase64(image);
  onStage("Reading receipt");
  const data = await http("/receipts", { method: "POST", body: { image: base64, contentType } });
  return (data.items ?? []).map(normalizeItem);
}

export async function generateRecipe() {
  const data = USE_MOCK ? await mock.generateRecipe() : await http("/recipes/generate", { method: "POST", body: {} });
  return normalizeRecipe(data);
}

export async function checkNotifications() {
  return USE_MOCK ? mock.checkNotifications() : http("/notifications/check", { method: "POST" });
}

export async function simulateDays(days) {
  return USE_MOCK ? mock.simulateDays(days) : http("/demo/simulate", { method: "POST", body: { days } });
}

export async function resetDemo() {
  return USE_MOCK ? mock.resetDemo() : http("/demo/reset", { method: "POST" });
}

// Returns base64 MP3 from Polly, or null so the caller falls back to browser speech.
export async function speak(text, voice = "Joanna") {
  if (USE_MOCK) return null;
  const data = await http("/speak", { method: "POST", body: { text, voice } });
  return data?.audio ?? null;
}
