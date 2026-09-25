# DESIGN.md — Design System (current state)

Source of truth is `src/app.css`. This file documents what exists today so agents can reuse it or evolve it deliberately. You are free to expand or replace this system; if you do, update this file.

## 1. Foundations

- **TailwindCSS 4** via `@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` (provides `prose`).
- **Fonts** (`@theme` in `app.css`, loaded via Fontsource in `src/main.ts`):
  - `--font-sans: "Geist Variable", "Geist", ui-sans-serif, system-ui, …`
  - `--font-mono: "Geist Mono Variable", "Geist Mono", ui-monospace, …`
- **Base** (`body`, `::selection` in `app.css`):
  - Background `#fff`, text `var(--color-neutral-900)`, antialiased.
  - Selection: neutral-900 bg, white text.
- **Palette (deliberately minimal):** white + Tailwind `neutral-*` scale only. No brand color, no dark mode. Accent surfaces: `neutral-950` (code blocks), `neutral-100/50` (wells), `red-50/600` (danger/errors only).
- **Chrome sync:** PWA `theme_color` / `background_color` (`#0f172a` in `vite.config.ts`) and `theme-color` meta in `index.html` must stay in sync with the app chrome when re-skinning.

## 2. Layout primitives

| Class | Usage |
|---|---|
| `.page` | Top-aligned column shell: `max-w-xl`, `min-h-dvh`, `px-6 py-24`. Use on every top-level `main`. |
| `.section` | Content section: top border + `mt-12 pt-8`. Headed by `.h2`. |
| `.footer` / `.footnote` | Footer bar / mono microcopy at page end. |
| `.actions` | Row of CTAs under a hero block (border-t, wraps). |
| `.meta` | Inline meta row with `.dot` separators. |

## 3. Type scale

| Class | Usage |
|---|---|
| `.eyebrow` | Mono, xs, uppercase, tracking-widest, neutral-400. Kicker above `.title`. |
| `.title` | `text-4xl → sm:text-5xl`, medium, tight tracking, `text-balance`. One per page. |
| `.lede` | Hero paragraph: 17px/7, neutral-500, `max-w-md`. |
| `.body` | Standard paragraph: 15px/7, neutral-500, `max-w-md`. |
| `.h2` | Section heading: lg, medium, tight. |
| `.link-inline` | Body link: neutral-900 underline, neutral-300 decoration → 500 on hover. |
| `.link-quiet` | Secondary link: sm neutral-500 → 900 on hover. |
| `.hint` | xs neutral-400 helper text. |

## 4. Components

**Buttons** — pill-shaped, `active:scale-[0.98]`:
- `.btn-primary` — primary CTA (neutral-900 bg, white text).

**Code:**
- `.pre` — dark block (`neutral-950` bg, neutral-200 mono text, rounded-2xl, scroll-x).
- `.code` — inline chip (neutral-100 bg, bordered). Nested reset (`.pre .code`) strips chip styling inside blocks.

**Steps / notes:**
- `.steps` + `li` + `.step-title` (neutral-900 medium) / `.step-body` (neutral-500).
- `.note` — neutral-50 info well, 13px.

**Overlays / toasts:**
- `.toast` (+ `.toast-text`, `.toast-btn-solid`, `.toast-btn-quiet`) — bottom-center pill used by `PwaUpdate.svelte`.

**GitHub footer:** `.github-link` + `.github-icon` (mono xs neutral-400 → 900).

## 5. Markdown rendering

- Post body renders via `{@html post.html}` inside `<article class="prose max-w-none pt-8">` (`src/routes/Post.svelte`).
- `prose` (typography plugin) styles raw markdown HTML; constrain surrounding layout with `.page`, not by overriding `prose` internals.
- Headings arrive with stable `id` + empty `.heading-anchor` link (see `knowledge/content-authoring.md`). Style `.heading-anchor` in `app.css` if visible anchors are wanted (currently unstyled).

## 6. How to change the look

1. **Re-skin:** edit `@theme` tokens (fonts, colors) — never inline ad-hoc Tailwind for layout; add/extend `@layer components` classes instead.
2. **Add a component:** define `.new-thing` with `@apply` in `@layer components`, reuse it in Svelte. Keep names semantic (`card-*`, `btn-*`), not utility dumps.
3. **Sync chrome:** after changing the dark/background color, update `theme_color`/`background_color` in `vite.config.ts` and `theme-color` in `index.html`.
4. **Prune freely:** `app.css` only keeps classes used by `src/`; delete a component class together with its last usage.

## 7. Non-goals (not yet built)

No dark mode, no brand palette, no spacing/type-scale tokens, no focus-ring system beyond the primary button/input, no syntax highlighting for code blocks. SEO defaults (canonical, OG/Twitter tags, `sitemap.xml`/`rss.xml`/`robots.txt`, per-route `<title>`) ship via `plugins/seo.ts` + `src/Seo.svelte`. Agents may add any of these — document additions here.
