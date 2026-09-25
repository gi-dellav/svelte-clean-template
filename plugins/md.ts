import type { Plugin } from "vite";
import matter from "gray-matter";
import { Marked, type Tokens } from "marked";
import GithubSlugger from "github-slugger";
import { copyFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";

/** Placeholder replaced at runtime with `import.meta.env.BASE_URL` (Pages sub-path aware). */
export const BASE_PLACEHOLDER = "__BASE__";

export function isExternalUrl(url: string): boolean {
  return (
    url === "" ||
    url.startsWith("#") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  );
}

/**
 * Rewrite asset/link URLs so they work under a GitHub Pages sub-path.
 * - `/foo.png`            -> `__BASE__foo.png` (root-absolute must be base-prefixed)
 * - `./foo.png`, `foo.png` -> `__BASE__content/<slug>/foo.png`
 *   (convention: colocated asset lives in `public/content/<slug>/foo.png`)
 * - `#anchor`, `http…`, `data:` -> untouched
 */
export function rewriteUrl(url: string, slug: string): string {
  const trimmed = url.trim();
  if (isExternalUrl(trimmed)) return url;
  if (trimmed.startsWith("/")) return `${BASE_PLACEHOLDER}${trimmed.slice(1)}`;
  const cleaned = trimmed.replace(/^(?:\.\/)+/, "").replace(/^(?:\.\.\/)+/, "");
  return `${BASE_PLACEHOLDER}content/${slug}/${cleaned}`;
}

export function rewriteSrcset(value: string, slug: string): string {
  // Split on commas, but re-join `data:` URLs (which contain a comma before
  // the base64 payload) before rewriting each candidate's URL.
  const parts = value.split(",");
  const candidates: string[] = [];
  let buffer = "";
  for (const part of parts) {
    buffer = buffer === "" ? part : `${buffer},${part}`;
    const trimmed = buffer.trim();
    if (/^data:/i.test(trimmed) && !/\s/.test(trimmed)) continue;
    candidates.push(buffer);
    buffer = "";
  }
  if (buffer !== "") candidates.push(buffer);

  return candidates
    .map((entry) => {
      const m = entry.match(/^(\s*)([^\s]+)([\s\S]*)$/);
      if (!m) return entry;
      const [, lead, url, rest] = m;
      if (url === undefined) return entry;
      return `${lead ?? ""}${rewriteUrl(url, slug)}${rest ?? ""}`;
    })
    .join(",");
}

export function rewriteAssetUrls(html: string, slug: string): string {
  const withSrcset = html.replace(
    /\ssrcset\s*=\s*("[^"]*"|'[^']*')/g,
    (match, quoted: string) => {
      const quote = quoted[0] ?? '"';
      const value = quoted.slice(1, -1);
      return match.replace(quoted, `${quote}${rewriteSrcset(value, slug)}${quote}`);
    },
  );
  return withSrcset.replace(
    /\s(?:src|href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g,
    (match, value: string) => {
      if (value.startsWith('"') || value.startsWith("'")) {
        const quote = value[0];
        const url = value.slice(1, -1);
        return match.replace(value, `${quote}${rewriteUrl(url, slug)}${quote}`);
      }
      return match.replace(value, rewriteUrl(value, slug));
    },
  );
}

export interface MdFrontmatter {
  title?: unknown;
  date?: unknown;
  description?: unknown;
  draft?: unknown;
  [key: string]: unknown;
}

/**
 * Static `.md` compilation: frontmatter via gray-matter, body via marked (GFM),
 * heading ids via github-slugger. Emits `{ metadata, slug, html }` — no runtime parser.
 */
export function mdPlugin(): Plugin {
  return {
    name: "md-content",
    enforce: "pre",
    transform(src: string, id: string) {
      const [filePath] = id.split("?");
      if (!filePath?.endsWith(".md")) return null;

      const slug = basename(filePath).replace(/\.md$/, "");
      const { data, content } = matter(src);
      const front = data as MdFrontmatter;

      if (typeof front.title !== "string" || front.title.trim() === "") {
        this.warn(`[md-content] ${filePath}: missing "title" frontmatter, falling back to slug.`);
      }
      const metadata = {
        title: typeof front.title === "string" && front.title.trim() !== "" ? front.title : slug,
        date: typeof front.date === "string" ? front.date : undefined,
        description: typeof front.description === "string" ? front.description : undefined,
        draft: front.draft === true,
      };

      const slugger = new GithubSlugger();
      const marked = new Marked({
        gfm: true,
        renderer: {
          heading({ tokens, depth }: Tokens.Heading): string {
            const inline = this.parser.parseInline(tokens);
            const id = slugger.slug(inline.replace(/<[^>]*>/g, ""));
            return `<h${depth} id="${id}"><a href="#${id}" class="heading-anchor" aria-hidden="true" tabindex="-1"></a>${inline}</h${depth}>`;
          },
        },
      });
      const rawHtml = marked.parse(content) as string;
      const html = rewriteAssetUrls(rawHtml, slug);

      const code =
        `const __base = import.meta.env.BASE_URL;\n` +
        `export const slug = ${JSON.stringify(slug)};\n` +
        `export const metadata = ${JSON.stringify(metadata)};\n` +
        `const __raw = ${JSON.stringify(html)};\n` +
        `export const html = __raw.replaceAll(${JSON.stringify(BASE_PLACEHOLDER)}, __base);\n` +
        `export default html;\n`;
      return { code, map: null };
    },
    closeBundle() {
      // GitHub Pages SPA fallback: serve the app shell for deep links like /repo/post/<slug>.
      // Done in-band so Workbox precaches 404.html (a post-build CI `cp` would miss the manifest).
      const outDir = this.environment?.config.build.outDir ?? "dist";
      const index = join(outDir, "index.html");
      const fallback = join(outDir, "404.html");
      if (existsSync(index)) copyFileSync(index, fallback);
    },
  };
}
