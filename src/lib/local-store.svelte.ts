import { browserStorage, readStored, writeStored } from "./storage.js";

export interface LocalStore<T> {
  readonly value: T;
  set(next: T): void;
  reset(): void;
}

/**
 * Reactive `localStorage`-backed store (Svelte 5 runes factory).
 *
 * ```svelte
 * <script lang="ts">
 *   import { localStore } from "../lib/local-store.svelte";
 *   const theme = localStore<"light" | "dark">("theme", "light");
 * </script>
 * <button onclick={() => theme.set(theme.value === "light" ? "dark" : "light")}>
 *   Theme: {theme.value}
 * </button>
 * ```
 *
 * Rules:
 * - Create inside component init (or module scope for a shared singleton) —
 *   never inside `$effect`/`$derived` (that would recreate state per run).
 * - Browser-guarded: falls back to `initial` where `localStorage` is missing.
 * - Test the pure layer (`src/lib/storage.ts` with `memoryStorage()`) with
 *   `bun test`. This file needs the Svelte compiler, so it is covered by
 *   `bun run check` + `bun run build`, not by unit tests.
 */
export function localStore<T>(key: string, initial: T): LocalStore<T> {
  let value = $state<T>(readStored(browserStorage(), key, initial));
  return {
    get value() {
      return value;
    },
    set(next: T) {
      value = next;
      writeStored(browserStorage(), key, next);
    },
    reset() {
      value = initial;
      writeStored(browserStorage(), key, initial);
    },
  };
}
