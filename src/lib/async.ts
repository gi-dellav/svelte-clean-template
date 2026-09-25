/**
 * Async fetch state machine + `fetchJson` wrapper.
 *
 * Component pattern:
 * ```svelte
 * <script lang="ts">
 *   import { onMount } from "svelte";
 *   import { errorState, fetchJson, loadingState, okState, toErrorMessage, type AsyncState } from "../lib/async";
 *
 *   let state = $state<AsyncState<string[]>>({ status: "idle" });
 *   onMount(() => {
 *     let cancelled = false;
 *     state = loadingState();
 *     fetchJson<string[]>("/api/items")
 *       .then((data) => { if (!cancelled) state = okState(data); })
 *       .catch((error: unknown) => { if (!cancelled) state = errorState(toErrorMessage(error)); });
 *     return () => { cancelled = true; };
 *   });
 * </script>
 * ```
 * Local static JSON: `fetchJson(withBase("/data/items.json"))` so the Pages
 * sub-path keeps working. Narrow in markup with `state.status === "ok"` etc.
 */

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

export function idleState<T>(): AsyncState<T> {
  return { status: "idle" };
}

export function loadingState<T>(): AsyncState<T> {
  return { status: "loading" };
}

export function okState<T>(data: T): AsyncState<T> {
  return { status: "ok", data };
}

export function errorState<T>(error: string): AsyncState<T> {
  return { status: "error", error };
}

/** Normalize anything thrown into a displayable message. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message !== "") return error.message;
  if (typeof error === "string" && error !== "") return error;
  return "Something went wrong.";
}

/**
 * `fetch` + JSON parse with HTTP-error normalization. Throws `Error` —
 * pair with `toErrorMessage`. Test your mapping/validation logic, not this
 * wrapper (it is intentionally thin).
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const status = `${response.status} ${response.statusText}`.trim();
    throw new Error(status === "" ? "Request failed." : `Request failed: ${status}`);
  }
  return (await response.json()) as T;
}
