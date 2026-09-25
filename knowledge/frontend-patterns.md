# Frontend patterns

How to grow this template into a full static webapp without diverging. Read
`architecture.md` first for the router/build/base-path model. Primitives:

| Need | Primitive | Test |
|---|---|---|
| persisted state | `src/lib/storage.ts` (pure) + `src/lib/local-store.svelte.ts` (runes) | `tests/storage.test.ts` |
| async fetch | `src/lib/async.ts` (`AsyncState`, `fetchJson`, `toErrorMessage`) | `tests/async.test.ts` |
| form validation | `src/lib/form.ts` (`required`, `emailField`, `minLength`, `validateAll`) | `tests/form.test.ts` |
| query/hash parsing | `parseQuery` / `parseHash` in `src/lib/router.ts` | `tests/router.test.ts` |

Test pyramid: pure logic in `bun test`; components via `bun run check` +
`bun run build` (no component runner by design — no DOM/jsdom in repo).

## 1. Add a route

Six mechanical steps; do all six or the route 404s under Pages.

1. Extend `Route` in `src/lib/router.ts`:
   ```ts
   export type Route =
     | { name: "home" }
     | { name: "about" }
     | { name: "post"; slug: string }
     | { name: "not-found"; path: string };
   ```
2. Add a `parseRoute` branch **before** the `not-found` fallthrough:
   ```ts
   if (path === "/about") return { name: "about" };
   ```
3. Add a switch arm in `src/App.svelte` with `<Seo/>` (see §2):
   ```svelte
   {:else if route.name === "about"}
     <Seo title="About" description="What this site is." path="/about/" />
     <About />
   ```
4. Link with `withBase()`: `<a href={withBase("/about")}>About</a>` — never
   hardcode `/`-rooted hrefs (Pages sub-path breaks).
5. Add a `parseRoute` case in `tests/router.test.ts` — route without a test
   is a regression waiting for a fork.
6. Rebuild: `bun run check && bun run test && bun run build`. Deep links
   (`/<repo>/about`) resolve via the in-band `dist/404.html` fallback — no
   extra config.

Parametrized routes follow the existing `post` shape:
`/post/<slug>` → `{ name: "post", slug }` with `decodeURIComponent` on the
capture and trailing-slash tolerance (`/^\/post\/([^/]+)\/?$/`). Keep
`not-found` last; keep `path` as the stripped path for the 404 message.

## 2. Lazy-load a heavy route

Keep the eager `import` for light routes (`Post.svelte`). For anything pulling
a big dependency (chart lib, editor, map), move it behind `import()` so the
home bundle stays small:

```svelte
<script lang="ts">
  import type { Component } from "svelte";
  import { onMount } from "svelte";

  let { slug }: { slug: string } = $props();

  let view = $state<Component<{ slug: string }> | undefined>(undefined);
  let failed = $state(false);

  // Reactive: reload if the same lazy route is re-entered with another slug.
  $effect(() => {
    const current = slug;
    let cancelled = false;
    view = undefined;
    failed = false;
    import("../routes/HeavyPost.svelte").then(
      (mod) => {
        if (!cancelled) view = mod.default;
      },
      () => {
        if (!cancelled) failed = true;
      },
    );
    return () => {
      cancelled = true;
    };
  });
</script>

{#if view}
  {@const View = view}
  <View {slug} />
{:else if failed}
  <main class="page">
    <p class="eyebrow">Error</p>
    <h1 class="title">Could not load this view.</h1>
  </main>
{:else}
  <main class="page"><p class="lede">Loading…</p></main>
{/if}
```

Rules:

- `let view = $state(...)` + `$effect` with a `cancelled` flag — assigning the
  promise directly (`$state(import(...))`) leaks a stale view on fast
  back-to-back navigations.
- Dynamic `import()` of a route file is statically analyzable by Vite: the
  chunk splits automatically, precached by Workbox. Do **not** build the spec
  dynamically (`import(path)` with a variable breaks the split — keep the
  `../routes/X.svelte` literal).
- Always render loading + failure states. A blank `<main>` on chunk failure
  (offline, deploy skew) is the #1 lazy-route bug.

## 3. `localStore`: persisted runes state

Pure layer is `src/lib/storage.ts` (`StorageLike`, `memoryStorage()`,
`browserStorage()`, `readStored`/`writeStored`/`clearStored` — all
never-throw, private-mode/quota safe). Reactive layer is
`src/lib/local-store.svelte.ts`:

```svelte
<script lang="ts">
  import { localStore } from "../lib/local-store.svelte";
  // Shared singleton: create in module scope of a lib file, import anywhere.
  const count = localStore<number>("demo-count", 0);
</script>

<button class="btn-primary" onclick={() => count.set(count.value + 1)}>
  Clicked {count.value} {count.value === 1 ? "time" : "times"}
</button>
<button class="link-quiet" onclick={() => count.reset()}>Reset</button>
```

Rules:

- Create inside component init or shared-module scope. Never inside
  `$effect`/`$derived` — the read of `localStorage` would re-run and reset
  state every cycle.
- Complex objects need explicit generics: `localStore<Settings>("settings", defaults)`.
- `local-store.svelte.ts` needs the Svelte compiler, so it is **not**
  `bun test`-covered by design. Test the pure `storage.ts` layer with
  `memoryStorage()` (`tests/storage.test.ts`) and rely on `bun run check`
  for the `.svelte.ts` typing.
- JSON shapes evolve: bump the key (`"settings-v2"`) rather than migrating —
  corrupt data already falls back to `initial`.

## 4. Fetch pattern: `AsyncState` + `fetchJson`

`src/lib/async.ts` gives the four-state union (`idle | loading | ok | error`)
plus a thin `fetch` wrapper that normalizes HTTP failures to `Error`. Use the
cancelled-flag `onMount` shape — `fetch` continues after unmount, only the
state write is guarded:

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { withBase } from "../lib/router";
  import {
    errorState,
    fetchJson,
    idleState,
    loadingState,
    okState,
    toErrorMessage,
    type AsyncState,
  } from "../lib/async";

  interface Item {
    title: string;
  }

  let state = $state<AsyncState<Item[]>>(idleState());

  onMount(() => {
    let cancelled = false;
    state = loadingState();
    // Local static JSON: withBase keeps the Pages sub-path working.
    fetchJson<Item[]>(withBase("/data/items.json"))
      .then((data) => {
        if (!cancelled) state = okState(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) state = errorState(toErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if state.status === "ok"}
  <ol class="steps">
    {#each state.data as item (item.title)}
      <li>{item.title}</li>
    {/each}
  </ol>
{:else if state.status === "loading"}
  <p class="lede">Loading…</p>
{:else if state.status === "error"}
  <p class="form-error" role="alert">{state.error}</p>
{:else}
  <p class="hint">Nothing loaded yet.</p>
{/if}
```

Rules:

- Always init to `idleState()` — `loadingState()` belongs inside `onMount`.
- Narrow on `state.status`: each branch sees `data`/`error` typed.
- External APIs: validate the JSON shape before `okState` (throw `Error` on
  mismatch — `toErrorMessage` already renders it).
- Retry = re-run the `onMount` body via a `load()` function, not a remount.
- Reused GETs: add `cache: "force-cache"` to `fetchJson(url, { cache: … })`.
- Tests cover constructors, `toErrorMessage`, and `fetchJson` with a stubbed
  global `fetch` (`tests/async.test.ts`). Do not test rendering states —
  keep the wrapper thin and test your mapping logic instead.

## 5. Form pattern: markup + validation

CSS: `.form` / `.field` / `.label` / `.input` / `.form-error` (`src/app.css`,
documented in `DESIGN.md` §4). Logic: `src/lib/form.ts` (`required`,
`emailField`, `minLength`, `validateAll`). Full-accessible example:

```svelte
<script lang="ts">
  import { emailField, minLength, required, validateAll } from "../lib/form";

  let name = $state("");
  let email = $state("");
  let bio = $state("");
  let errors = $state<Record<string, string>>({});
  let sent = $state(false);

  const validators = {
    name: (v: string) => required(v, "Name"),
    email: emailField,
    bio: (v: string) => (v.trim() === "" ? undefined : minLength(v, 10, "Bio")),
  };

  function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    errors = validateAll({ name, email, bio }, validators);
    sent = Object.keys(errors).length === 0;
  }

  function fieldError(name: "name" | "email" | "bio"): string | undefined {
    return errors[name];
  }
</script>

<form class="form" {onsubmit} novalidate>
  <div class="field">
    <label class="label" for="contact-name">Name</label>
    <input
      class="input"
      id="contact-name"
      name="name"
      type="text"
      autocomplete="name"
      bind:value={name}
      aria-invalid={fieldError("name") !== undefined}
      aria-describedby={fieldError("name") !== undefined ? "contact-name-error" : undefined}
    />
    {#if fieldError("name")}
      <p class="form-error" id="contact-name-error" role="alert">{fieldError("name")}</p>
    {/if}
  </div>

  <div class="field">
    <label class="label" for="contact-email">Email</label>
    <input
      class="input"
      id="contact-email"
      name="email"
      type="email"
      autocomplete="email"
      bind:value={email}
      aria-invalid={fieldError("email") !== undefined}
      aria-describedby={fieldError("email") !== undefined ? "contact-email-error" : undefined}
    />
    {#if fieldError("email")}
      <p class="form-error" id="contact-email-error" role="alert">{fieldError("email")}</p>
    {/if}
  </div>

  <div class="field">
    <label class="label" for="contact-bio">Bio <span class="hint">(optional, 10+ characters)</span></label>
    <textarea
      class="input"
      id="contact-bio"
      name="bio"
      rows="3"
      bind:value={bio}
      aria-invalid={fieldError("bio") !== undefined}
      aria-describedby={fieldError("bio") !== undefined ? "contact-bio-error" : undefined}
    ></textarea>
    {#if fieldError("bio")}
      <p class="form-error" id="contact-bio-error" role="alert">{fieldError("bio")}</p>
    {/if}
  </div>

  <div class="actions">
    <button class="btn-primary" type="submit">Send</button>
  </div>

  {#if sent}
    <p class="note" role="status">Thanks — received.</p>
  {/if}
</form>
```

Rules:

- Every field: `.field > .label[for] + .input[id] + optional .form-error`.
  `id` and error-id must be unique per form instance.
- `aria-invalid` only when an error is shown; `aria-describedby` only then —
  never point at a non-existent id.
- `.form-error` always carries `role="alert"` (announced); success uses
  `role="status"`.
- Validate on submit via `validateAll`. Live per-keystroke re-validation is
  optional — if added, only re-validate fields already in `errors`.
- Custom styling: invalid border comes from `.input[aria-invalid="true"]` —
  do not toggle classes by hand.
- `novalidate` on the `<form>`: native bubbles would bypass the styled errors.
- Keep validators pure in `src/lib/form.ts` (covered by `tests/form.test.ts`);
  keep the component thin. New field type = new pure validator + test, not
  inline logic in the Svelte file.

## 6. Query + hash

Routes match on `pathname` only; query/hash are per-route concerns:

```ts
import { currentQuery, currentHash } from "./lib/router";

// /search?q=hello%20world → "hello world" ("" when absent)
const q = currentQuery().get("q") ?? "";
// /post/x#section → "#section" ("" when absent)
const hash = currentHash();
```

Pure helpers for tests: `parseQuery("?q=a%20b")`, `parseHash("#top")`.
`withBase` preserves both — existing test in `tests/router.test.ts` pins
`withBase("/search?q=…", "/repo")`. Never hand-concatenate `?`/`#` onto a
`withBase()` result that already carries them; use `URLSearchParams` to
compose, then `withBase`.
