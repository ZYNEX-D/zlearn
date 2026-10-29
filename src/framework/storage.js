/**
 * Chemia Framework - Safe Storage Layer
 */

export function loadJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Chemia] Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

export function saveJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`[Chemia] Storage quota exceeded or disabled for ${key}:`, err);
    return false;
  }
}
