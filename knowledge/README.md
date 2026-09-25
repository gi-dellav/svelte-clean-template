# knowledge/ — deep-dive guides

Docs-only directory for agents and humans. It is **never imported by `src/`/`plugins/`, never referenced in `vite.config.ts`, and never built into `dist/`**. If you replace the subsystem a file describes, update or delete that file.

## Index

| File | Read when… |
|---|---|
| `architecture.md` | Touching routing, build pipeline, base path, or PWA. Start here for structural changes. |
| `content-authoring.md` | Adding/editing markdown posts, frontmatter, or content assets. |
| `deployment.md` | Changing CI, deploy workflow, `BASE_PATH`, PWA manifest, or publishing elsewhere. |
| `frontend-patterns.md` | Adding a route, lazy import, persisted state, async fetch, form, or query/hash. Recipe book with tested primitives. |

Shorter context: `AGENTS.md` (agent entrypoint), `DESIGN.md` (design system = current `app.css`).
