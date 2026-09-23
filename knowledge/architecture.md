# Architecture

Stack: **Svelte 5 (runes) + Vite 8 + TailwindCSS 4 (Vite plugin) + `vite-plugin-pwa` + Bun**. No SvelteKit, no external router. Output is a fully static `dist/`.

## 1. Entry & route switch

`index.html` → `src/main.ts` (imports Geist Fontsource fonts + `app.css`, mounts `App` on `#app`) → `src/App.svelte`:

- `route = $state<Route>({ name: "home" })`; `activePost = $derived(...)` via `getPost(slug)`.
- `onMount` wires `popstate` (recompute route + scroll to top) and a document-level `click` listener delegating to `handleLinkClick`. Cleanup removes both.
- Three states: `home` (demo landing), `post` (renders `src/routes/Post.svelte` or an inline 404 block), `not-found` (shows `route.path`).
- `<PwaUpdate/>` is always mounted (toast UI for SW updates).

## 2. Router (`src/lib/router.ts`)

`Route = { home } | { post, slug } | { not-found, path }`.

- `basePath()` reads `import.meta.env.BASE_URL` (trailing slash stripped).
- `pathWithoutBase(pathname)` strips the Pages sub-path (`/<repo>`) so matching always runs on `/…`.
- `parseRoute` matches `/` → home, `/post/<slug>` (trailing slash tolerated, `decodeURIComponent` on slug) → post, else not-found.
- `withBase(path)` prefixes `BASE_URL` for every internal `href`. `navigate(path)` pushes `withBase`d URL and dispatches `popstate`.
- `handleLinkClick(event)` keeps navigation client-side: ignores non-left-click, modifier keys, `target="_blank"`, `download`, `rel="external"`, `#`/`mailto:`/absolute-scheme hrefs, and cross-origin URLs. Same-path navigations only scroll to `url.hash` if present. Everything else is intercepted, `preventDefault`ed, and pushed via history API.

**Rules:** build internal links with `withBase()`, navigate with `navigate()`/`handleLinkClick()`, match with `pathWithoutBase()`. Never hardcode `/`-rooted hrefs in app code. External links: `target="_blank" rel="noreferrer"`.

Adding a route: extend `Route`, add a `parseRoute` branch, add a switch arm in `App.svelte`, link to it with `withBase()`.

## 3. Build pipeline (`vite.config.ts`, `plugins/md.ts`)

Plugin order: `mdPlugin()` (`enforce: "pre"`) → `svelte()` → `tailwindcss()` → `VitePWA()`.

1. `mdPlugin.transform` compiles each `src/content/*.md` at build time (frontmatter via `gray-matter`, GFM via `marked`, heading ids via `github-slugger`); see `content-authoring.md`.
2. Svelte compiles runes components (`vitePreprocess` per `svelte.config.js`).
3. Tailwind 4 scans Svelte + generated HTML; component classes come from `@layer components` in `src/app.css`.
4. `VitePWA` emits the service worker + manifest, precaching `**/*.{js,css,html,svg,png,ico,woff2}` with `cleanupOutdatedCaches`.
5. `mdPlugin.closeBundle` copies `dist/index.html` → `dist/404.html` **in-band** (so Workbox precaches the fallback). This is the SPA deep-link fallback for routes like `/<repo>/post/<slug>` — do not replace with a post-build `cp`.

## 4. Base path (GitHub Pages sub-path)

Project sites serve under `https://<owner>.github.io/<repo>/`, so `vite.config.ts` derives `base`:

- `BASE_PATH` env (trimmed; empty = unset) wins when set.
- Else, under `GITHUB_ACTIONS` with a non-user-site repo (`<repo>` not ending in `.github.io`): `/<repo>/`.
- Else `/`.

`PwaUpdate` needs no base handling; manifest `start_url`/`scope` are set to `base` so "Add to Home Screen" works under the sub-path. Content asset URLs use the `__BASE__` placeholder replaced at runtime with `import.meta.env.BASE_URL` (see `content-authoring.md`).

User site (`<user>.github.io`) or custom domain: set repo variable `BASE_PATH=/` (Settings → Secrets and variables → Actions → Variables). Local sub-path preview: `BASE_PATH=/my-sub-path/ bun run build`.

## 5. PWA

- `VitePWA({ registerType: "autoUpdate", includeAssets: ["favicon.svg", "apple-touch-icon.png"], manifest: { name, short_name, description, theme_color/background_color #0f172a, display standalone, start_url/scope = base, icons: 192/512/maskable } })`. Icons live in `public/`.
- `src/PwaUpdate.svelte`: `registerSW` from `virtual:pwa-register`; `needRefresh` → "A new version is available." + Reload toast; `offlineReady` → "Ready to work offline." + auto-dismiss after 4s. Styled with `.toast*` classes, `fly` transition.
- Keep `theme_color`, `index.html` `theme-color` meta, and app chrome in sync when re-skinning.

## 6. Strictness

`tsconfig.json`: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` (+ `erasableSyntaxOnly`), `noEmit`. `bun run check` (`svelte-check`) must pass before `bun run build`. Use `import type` for types; narrow `unknown` explicitly.
