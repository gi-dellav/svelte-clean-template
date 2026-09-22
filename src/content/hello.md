---
title: "Hello, markdown"
date: "2026-09-22"
description: "First post of the static markdown content collection."
---

# Hello, markdown

This post is compiled to HTML at build time — no markdown parser ships to the browser.

## A table (GFM)

| Feature    | Supported |
| ---------- | --------- |
| Tables     | Yes       |
| Task lists | Yes       |
| Frontmatter | Yes      |

## A task list (GFM)

- [x] Compile `.md` to HTML in a Vite plugin
- [x] Expose `{ metadata, html }` for import
- [ ] Add syntax highlighting later

## Links and anchors

Jump to the [task list](#a-task-list-gfm) via a heading anchor. Every `h1`–`h3` gets a stable `id` from the same slugger GitHub uses.
