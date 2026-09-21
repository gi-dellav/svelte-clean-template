# svelte-clean-template

A clean static webapp template: **Svelte 5 + Vite + TailwindCSS 4 + PWA**, managed with **Bun**.

## Stack

- [Svelte 5](https://svelte.dev) with runes
- [Vite](https://vite.dev) build tooling
- [TailwindCSS 4](https://tailwindcss.com) via the Vite plugin
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) — manifest, service worker, offline caching

## Getting started

```bash
bun install
bun run dev       # start the dev server
bun run build     # production build into dist/
bun run preview   # preview the production build
bun run check     # svelte-check type/diagnostics
```

The `dist/` folder is a fully static bundle — deploy it to any static host
(GitHub Pages, Netlify, Cloudflare Pages, ...).

## Project structure

```
index.html            # Vite entry
vite.config.ts        # Svelte, Tailwind and PWA plugins
svelte.config.js
src/
  main.ts             # mounts App
  App.svelte          # sample page
  PwaUpdate.svelte    # offline-ready / update prompts
  app.css             # Tailwind import + theme tokens
public/               # favicon, PWA icons
```

## PWA

The service worker is generated at build time with `registerType: "autoUpdate"`.
Edit the manifest name, colors and icons in `vite.config.ts`. Icons live in
`public/` and are precached automatically.

## Theming

Design tokens (colors, radius, fonts) are defined in `src/app.css` under
`@theme` — change them there to re-skin the whole app.
