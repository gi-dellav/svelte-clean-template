# Deployment

Static output: `bun run build` → `dist/`, deployable to any static host. GitHub Pages is wired by default.

## 1. Workflows

**CI** (`.github/workflows/ci.yml`) — every push to `main` + every PR: `setup-bun` → `bun install --frozen-lockfile` → `bun run check` → `bun run build`. No config needed on forks.

**Deploy** (`.github/workflows/deploy.yml`) — every push to `main` + manual dispatch (`Actions → Deploy to GitHub Pages → Run workflow`):

1. Same install/check/build steps (`BASE_PATH` from repo variable `vars.BASE_PATH`; empty = auto-detect — see `architecture.md` §4).
2. `touch dist/.nojekyll` (so `_`-prefixed bundled assets serve correctly on Pages).
3. `configure-pages` → `upload-pages-artifact` (`path: dist`) → `deploy-pages` (env `github-pages`, `pages: write` + `id-token: write`).
4. Concurrency group `pages`, `cancel-in-progress: false` — queued runs wait, in-progress deploys finish.

## 2. One-time Pages setup

1. Use this template / fork, keeping `main`.
2. Repo → **Settings → Pages → Build and deployment** → source **GitHub Actions**.
3. Push to `main`. Site appears at `https://<owner>.github.io/<repo>/`.

## 3. Base path overrides

`vite.config.ts` derives `/<repo>/` from `GITHUB_REPOSITORY` automatically — forks deploy with zero changes. Override only when **not** on a project sub-path:

- User site (`<user>.github.io`) or custom domain → repo variable `BASE_PATH=/` (Settings → Secrets and variables → Actions → Variables).
- Other host / local sub-path check → `BASE_PATH=/my-sub-path/ bun run build`.

## 4. Manual deploy (any static host)

```bash
bun run build    # outputs to dist/
```

Upload `dist/` to Netlify, Cloudflare Pages, S3, Nginx, … Note: `dist/404.html` (SPA fallback copy of `index.html`) is harmless on non-Pages hosts — plain static servers ignore it; SPA-style hosts can reuse it as the fallback route. `dist/.nojekyll` is Pages-specific; other hosts ignore it.

## 5. PWA + deploy interaction

The service worker + manifest are generated at build time with `start_url`/`scope` = build `base`. Custom-domain or user-site moves therefore require a rebuild with the matching `BASE_PATH`, or "Add to Home Screen" scope breaks. Workbox precaches `**/*.{js,css,html,svg,png,ico,woff2}` including the in-band `404.html`; `PwaUpdate.svelte` prompts on new versions (`registerType: "autoUpdate"`).
