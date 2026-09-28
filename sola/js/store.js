/**
 * Plans live in IndexedDB on this device.
 * If IndexedDB is blocked, the same records fall back to localStorage.
 *
 * Each plan is a plain object with id and updatedAt. A future account sync
 * can wrap createRepository() and merge by those fields without changing screens.
 */

import { sanitizePlan } from "./model.js";

const SETTINGS_KEY = "sola-settings";
const FALLBACK_KEY = "sola-plans-v1";
const THEMES = ["sol", "moon", "sage", "lavender", "ocean", "rose"];

function readFallback() {
  try {
    const raw = JSON.parse(localStorage.getItem(FALLBACK_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      try {
        return sanitizePlan(item);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function writeFallback(plans) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(plans));
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("no-idb"));
      return;
    }
    const request = indexedDB.open("sola", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("plans")) {
        const store = db.createObjectStore("plans", { keyPath: "id" });
        store.createIndex("byDate", "date");
        store.createIndex("byUpdated", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("idb"));
  });
}

function requestDone(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("idb-request"));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error("aborted"));
    tx.onerror = () => reject(tx.error || new Error("tx"));
  });
}

export function loadSettings() {
  let raw = {};
  try {
    raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    raw = {};
  }
  const theme = THEMES.includes(raw.theme) ? raw.theme : "sol";
  const lang = raw.lang === "ru" || raw.lang === "en"
    ? raw.lang
    : (navigator.language || "").toLowerCase().startsWith("ru")
      ? "ru"
      : "en";
  return {
    theme,
    lang,
    notificationsEnabled: Boolean(raw.notificationsEnabled),
  };
}

export function saveSettings(settings) {
  const next = {
    theme: THEMES.includes(settings.theme) ? settings.theme : "sol",
    lang: settings.lang === "ru" ? "ru" : "en",
    notificationsEnabled: Boolean(settings.notificationsEnabled),
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* Private mode can refuse storage; the session still works in memory. */
  }
  return next;
}

export function createRepository() {
  let dbPromise = null;
  let mode = "idb";

  async function database() {
    if (mode === "local") return null;
    if (!dbPromise) dbPromise = openDB();
    try {
      return await dbPromise;
    } catch (error) {
      mode = "local";
      dbPromise = null;
      throw error;
    }
  }

  function writeLocal(plan) {
    const all = readFallback().filter((item) => item.id !== plan.id);
    all.push(plan);
    writeFallback(all);
  }

  return {
    async all() {
      try {
        if (mode === "local") return readFallback();
        const db = await database();
        const tx = db.transaction("plans", "readonly");
        const rows = await requestDone(tx.objectStore("plans").getAll());
        await txDone(tx);
        return rows.map((row) => {
          try {
            return sanitizePlan(row);
          } catch {
            return null;
          }
        }).filter(Boolean);
      } catch {
        mode = "local";
        return readFallback();
      }
    },
    async put(plan) {
      const clean = sanitizePlan(plan);
      if (mode === "local") {
        writeLocal(clean);
        return clean;
      }
      try {
        const db = await database();
        const tx = db.transaction("plans", "readwrite");
        tx.objectStore("plans").put(clean);
        await txDone(tx);
        return clean;
      } catch (error) {
        if (mode === "local") {
          writeLocal(clean);
          return clean;
        }
        throw error;
      }
    },
    async remove(id) {
      if (mode === "local") {
        writeFallback(readFallback().filter((item) => item.id !== id));
        return;
      }
      try {
        const db = await database();
        const tx = db.transaction("plans", "readwrite");
        tx.objectStore("plans").delete(id);
        await txDone(tx);
      } catch (error) {
        if (mode === "local") {
          writeFallback(readFallback().filter((item) => item.id !== id));
          return;
        }
        throw error;
      }
    },
  };
}
