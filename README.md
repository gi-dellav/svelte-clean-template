# svelte-clean-template

A clean static webapp template: **Svelte 5 + Vite + TailwindCSS 4 + PWA**, managed with **Bun**,
with **GitHub Actions CI + GitHub Pages deploy** built in.

Repository: [github.com/gi-dellav/svelte-clean-template](https://github.com/gi-dellav/svelte-clean-template)

Live demo: [gi-dellav.github.io/svelte-clean-template](https://gi-dellav.github.io/svelte-clean-template/)
(served from `dist/` by the `Deploy to GitHub Pages` workflow).

## Stack

- [Svelte 5](https://svelte.dev) with runes
- [Vite](https://vite.dev) build tooling
- [TailwindCSS 4](https://tailwindcss.com) via the Vite plugin
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) — manifest, service worker, offline caching
- [Bun](https://bun.sh) — package manager, scripts and CI runtime
- [GitHub Actions](https://github.com/features/actions) + [GitHub Pages](https://pages.github.com) — check, build and deploy

## Getting started

Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
bun install
bun run dev       # start the dev server
bun run build     # production build into dist/
bun run preview   # preview the production build
bun run check     # svelte-check type/diagnostics
```

The `dist/` folder is a fully static bundle — deploy it to any static host
(GitHub Pages, Netlify, Cloudflare Pages, ...). The sample page in `src/App.svelte`
also walks through these same steps in the browser.

## Project structure

```
.github/workflows/
  ci.yml              # check + build on every push / PR (Bun)
  deploy.yml          # build dist/ and publish to GitHub Pages on push to main
index.html            # Vite entry
vite.config.ts        # Svelte, Tailwind and PWA plugins (+ Pages-aware base path)
svelte.config.js
src/
  main.ts             # mounts App
  App.svelte          # sample page (usage + deploy guide)
  PwaUpdate.svelte    # offline-ready / update prompts
  app.css             # Tailwind import + theme tokens
public/               # favicon, PWA icons
```

## Continuous integration (Bun)

`.github/workflows/ci.yml` runs on every push to `main` and on every pull request:

1. `oven-sh/setup-bun` installs the latest Bun
2. `bun install --frozen-lockfile` installs dependencies reproducibly
3. `bun run check` runs `svelte-check`
4. `bun run build` verifies the production build compiles

No configuration needed — it works as-is on forks.

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` publishes the static `dist/` build to GitHub Pages on every
push to `main` (or manually via **Actions → Deploy to GitHub Pages → Run workflow**).
It reuses the same Bun install/check/build steps, then uploads `dist/` with
`actions/upload-pages-artifact` and deploys it with `actions/deploy-pages`.

### One-time setup

1. **Use this template** (or fork the repo), keeping the default `main` branch.
2. In your repo go to **Settings → Pages → Build and deployment** and select
   **GitHub Actions** as the source. (The workflow's `pages: write` permission + the
   `github-pages` environment handle the rest — no personal access token needed.)
3. Push to `main`. The `Deploy to GitHub Pages` workflow builds and publishes `dist/`;
   your site appears at `https://<owner>.github.io/<repo>/`.

### How the base path works

GitHub Pages serves project sites under a `/<repo>/` sub-path, so `vite.config.ts`
derives `base` automatically from `GITHUB_REPOSITORY` during Actions builds (e.g.
`/svelte-clean-template/`). Forks therefore deploy correctly with zero code changes.

Only override it when you are **not** on a project sub-path:

- User site (`<user>.github.io`) or custom domain → set the repository variable
  `BASE_PATH=/` under **Settings → Secrets and variables → Actions → Variables**.
- Local preview or another host → `BASE_PATH=/my-sub-path/ bun run build`.

The PWA manifest `start_url`/`scope` follow the same `base`, so "Add to Home Screen"
keeps working under the sub-path.

### Manual deploy (any static host)

```bash
bun run build    # outputs to dist/
```

Then upload `dist/` to Netlify, Cloudflare Pages, S3, Nginx, … The Pages workflow
additionally writes `dist/.nojekyll` so files starting with `_` (e.g. bundled assets)
are served correctly on Pages.

## PWA

The service worker is generated at build time with `registerType: "autoUpdate"`.
Edit the manifest name, colors and icons in `vite.config.ts`. Icons live in
`public/` and are precached automatically.

## Theming

Design tokens (colors, radius, fonts) are defined in `src/app.css` under
`@theme` — change them there to re-skin the whole app.
