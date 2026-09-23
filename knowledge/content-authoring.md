# Content authoring

Posts are build-time `.md → HTML`: no markdown parser ships to the browser. Pipeline: `plugins/md.ts` (compile) → `src/lib/posts.ts` (collect) → `src/routes/Post.svelte` (render).

## 1. Add a post

Create `src/content/<slug>.md` — filename (minus `.md`) is the slug, routed at `/post/<slug>`:

```md
---
title: "My post"                 # required (falls back to slug with a build warning)
date: "2026-09-23"               # optional, ISO-ish string; drives sort + eyebrow
description: "One-line summary." # optional; shown in list + lede
draft: true                      # optional; hidden in PROD builds only (visible in dev)
---

# My post

Body in GFM (tables, task lists, …). Every h1–h3 gets a stable id.
```

List page (`src/App.svelte`) renders `posts` with `withBase(`/post/${post.slug}`)` links. Detail page (`src/routes/Post.svelte`) shows `date ?? slug` eyebrow, `title`, optional `description` lede, then `{@html post.html}` inside `<article class="prose max-w-none pt-8">`.

## 2. Pipeline details (`plugins/md.ts`)

- **Frontmatter** via `gray-matter`, narrowed from `unknown`: only `title`/`date`/`description` strings and `draft === true` survive; types in `src/md.d.ts` (`PostMetadata`, `PostModule`, `*.md` module declaration).
- **Body** via `Marked({ gfm: true })`. Custom heading renderer: strips tags, slugs with `github-slugger` (same algorithm GitHub uses), emits `<hN id="…"><a href="#…" class="heading-anchor" …></a>…</hN>`. Link to sections with `[text](#the-heading-id)`.
- **Module shape** per file: `{ slug, metadata, html, default }`. `html` has its `__BASE__` placeholders replaced at runtime with `import.meta.env.BASE_URL`.
- Missing/blank `title` warns at build time and falls back to the slug.

## 3. Collection (`src/lib/posts.ts`)

```ts
import.meta.glob<PostModule>("../content/*.md", { eager: true })
```

mapped to `{ slug, metadata, html }`, filtered (`draft` excluded when `import.meta.env.PROD`), sorted date-desc by `localeCompare` on `date ?? ""`. `getPost(slug)` is a linear find — fine at this scale.

## 4. Assets

Images/files referenced in markdown are rewritten by `rewriteUrl(url, slug)`; `src`/`href` attributes only. External URLs (`#`, `http(s):`, `mailto:`, `data:`, `blob:`) pass through untouched:

| You write | Emitted | Convention |
|---|---|---|
| `/x` | `__BASE__x` → base-prefixed | File lives in `public/x` |
| `./x` or `x` | `__BASE__content/<slug>/x` | Colocate in `public/content/<slug>/x` |

Leading `./` and `../` prefixes are stripped before colocation. Keep the `__BASE__` placeholder flow — never hardcode the Pages sub-path.

## 5. Gotchas

- Only `*.md` under `src/content/` is collected (`import.meta.glob("../content/*.md")`). Markdown elsewhere is compiled by the plugin but never listed — `knowledge/*.md` intentionally stays out (docs-only, never imported, never built into `dist/`).
- `draft: true` posts still appear under `bun run dev`; verify hiding with a production build.
- Dates are plain strings — keep ISO `YYYY-MM-DD` format so lexical sort == chronological sort.
- Rendered HTML is injected with `{@html}`: author content is trusted; do not render untrusted user input this way.
