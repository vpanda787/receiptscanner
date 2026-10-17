export const APP_NAME = "Shelf Life";

export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || !API_BASE;
export const DEMO_USER = import.meta.env.VITE_DEMO_USER || "demo";

// Items expiring within this many days count as "use soon" (matches the backend alert window).
export const SOON_DAYS = 2;

export const CATEGORIES = ["produce", "dairy", "meat", "seafood", "bakery", "pantry", "frozen", "other"];
