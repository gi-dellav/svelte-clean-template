/**
 * Minimal `Storage` surface (subset of Web Storage) so persistence helpers stay
 * pure and unit-testable without a DOM. Pass `browserStorage()` in components,
 * `memoryStorage()` in tests.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory `StorageLike` for tests and non-browser fallbacks. */
export function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

/** `localStorage` when running in a browser, otherwise `undefined` (SSR/tests). Never throws. */
export function browserStorage(): StorageLike | undefined {
  try {
    if (typeof localStorage === "undefined") return undefined;
    // Touch it: Safari private mode exposes `localStorage` but throws on access.
    const probe: StorageLike = localStorage;
    return probe;
  } catch {
    return undefined;
  }
}

/** Read JSON-backed `key`, falling back when missing, corrupt, or inaccessible. Never throws. */
export function readStored<T>(storage: StorageLike | undefined, key: string, fallback: T): T {
  if (storage === undefined) return fallback;
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Write JSON-backed `key`. Best-effort: quota/private-mode failures are swallowed. Never throws. */
export function writeStored<T>(storage: StorageLike | undefined, key: string, value: T): void {
  if (storage === undefined) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // In-memory state still works; persistence is best-effort.
  }
}

/** Remove `key`. Never throws. */
export function clearStored(storage: StorageLike | undefined, key: string): void {
  if (storage === undefined) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}
