# AGENTS.md

Guidance for AI coding agents working in this repo. Humans: see `README.md` for onboarding; agents: this file is your entrypoint.

## 1. What this is

A clean static webapp template: **Svelte 5 (runes) + Vite 8 + TailwindCSS 4 + PWA**, managed with **Bun**. No SvelteKit, no external router. It builds to a fully static `dist/` and deploys to GitHub Pages via Actions.

- Entry: `index.html` → `src/main.ts` → `src/App.svelte`
- Routing: hand-rolled history-API SPA in `src/lib/router.ts` (`home | post <slug> | not-found`)
- Content: build-time `.md → HTML` via `plugins/md.ts`, listed in `src/lib/posts.ts`, rendered in `src/routes/Post.svelte`
- Styling: design tokens + component classes in `src/app.css` (see `DESIGN.md`)
- PWA: manifest + service worker in `vite.config.ts`, update UI in `src/PwaUpdate.svelte`
- CI/deploy: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

## 2. You are free to change anything

This template is **fully flexible**. Restructure folders, delete the demo page, swap styling, add dependencies, replace the router or the markdown pipeline — all normal. Treat everything below as current conventions to follow **only while the subsystem they describe still exists**. If you replace a subsystem, update or delete the docs that describe it (`DESIGN.md`, `knowledge/`).

## 3. Commands (Bun only)

```bash
bun install       # install dependencies
bun run dev       # start the dev server
bun run check     # svelte-check type/diagnostics — must pass before build
bun run test      # unit tests with bun test — must pass before build
bun run build     # production build into dist/
bun run preview   # preview the production build
```

Bun only. Test runner is `bun test` (`tests/*.test.ts`); CI runs `check` + `test` + `build`.

## 4. Code map

| Path | Role |
|---|---|
| `index.html` | Vite entry, mounts `#app`, PWA icon links, `theme-color` |
| `src/main.ts` | Imports Geist fonts + `app.css`, mounts `App` |
| `src/App.svelte` | Root route switch; demo landing page (counter, posts list, deploy guide) |
| `src/lib/router.ts` | `Route`, `withBase`, `pathWithoutBase`, `navigate`, `currentRoute`, `handleLinkClick`, `parseQuery`, `parseHash` |
| `src/lib/posts.ts` | `import.meta.glob` over `src/content/*.md`, draft filter, date-desc sort |
| `src/lib/storage.ts` | Never-throw `localStorage` helpers (`StorageLike`, `memoryStorage`, `readStored`, …) |
| `src/lib/local-store.svelte.ts` | Runes `localStore(key, initial)` factory (check/build-covered, not unit-tested) |
| `src/lib/async.ts` | `AsyncState` machine + `fetchJson` + `toErrorMessage` |
| `src/lib/form.ts` | Pure validators (`required`, `emailField`, `minLength`, `validateAll`) |
| `src/routes/Post.svelte` | Renders `{@html post.html}` inside `article.prose` |
| `src/content/*.md` | Markdown posts with frontmatter |
| `plugins/md.ts` | Vite plugin: frontmatter + GFM render + heading ids + asset rewrite + `404.html` |
| `plugins/seo.ts` | Build-time SEO: head injection (canonical/`og:url`/RSS) + `sitemap.xml`/`rss.xml`/`robots.txt` |
| `src/Seo.svelte` | Per-route `<title>`/description/canonical/OG via `<svelte:head>` |
| `src/md.d.ts` | `PostMetadata` / `PostModule` types + `*.md` module declaration |
| `src/app.css` | Tailwind import, `@theme` tokens, `@layer components` classes |
| `vite.config.ts` | `mdPlugin`, `seoPlugin`, Svelte, Tailwind, `VitePWA`; Pages-aware `base` + `SITE_URL` derivation |
| `svelte.config.js` | `vitePreprocess()` |
| `tsconfig.json` | Strict: `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` |

## 5. Invariants (while these subsystems exist)

1. **Base-aware links.** Pages serves project sites under `/<repo>/`. Always build internal links with `withBase(path)`, navigate with `navigate()` / `handleLinkClick()`, match with `pathWithoutBase()`. Never hardcode `/`-rooted hrefs in app code. External links use `target="_blank" rel="noreferrer"`.
2. **SPA fallback.** `mdPlugin.closeBundle()` copies `dist/index.html` → `dist/404.html` **in-band** so Workbox precaches it. Do not replace with a post-build `cp`.
3. **Markdown asset convention.** `/x` → base-prefixed; `./x` or `x` → colocated asset in `public/content/<slug>/x`. Keep `__BASE__` placeholder flow in `plugins/md.ts`.
4. **PWA scope.** `start_url`/`scope` follow `base`; icons live in `public/` and are listed in `includeAssets`. Keep manifest `theme_color` in sync with the app chrome.
5. **Strict check.** `bun run check` must pass before `bun run build`. Respect `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax` (use `import type` where appropriate).

## 6. Conventions

- **Styling:** reuse `@layer components` classes from `src/app.css`; change the look by editing `@theme` tokens, not by inlining ad-hoc Tailwind everywhere. Render markdown HTML inside `prose`. See `DESIGN.md`.
- **Interactive patterns:** `knowledge/frontend-patterns.md` is the recipe book (add route + lazy import, `localStore`, async fetch, form, query/hash). Use its primitives in `src/lib/`; keep new validators/state pure and `bun test`-covered.
- **Fonts:** via Fontsource (`@fontsource-variable/geist`, `geist-mono`), wired in `main.ts` and `@theme`.
- **Posts:** `src/content/<slug>.md` with `title` (required), `date`, `description`, `draft` frontmatter. `draft: true` hides the post in `PROD` builds only.
- **TypeScript:** strict; prefer `import type`, avoid unused locals/params, narrow `unknown` frontmatter explicitly.

## 7. Where to read next

- `DESIGN.md` — the design system (documents current `app.css`; agents may expand it).
- `knowledge/README.md` — index of deep-dive guides:
  - `knowledge/architecture.md` — router, build pipeline, base path, PWA
  - `knowledge/content-authoring.md` — markdown pipeline, frontmatter, assets
  - `knowledge/deployment.md` — CI, Pages setup, `BASE_PATH`, manual deploy
  - `knowledge/frontend-patterns.md` — route/lazy, `localStore`, async, form, query recipes

`knowledge/` is **docs-only**: it lives at the repo root, is never imported by `src/`/`plugins/`, and is never built into `dist/`. Keep it that way.
