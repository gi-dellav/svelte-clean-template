import type { Plugin } from "vite";
import matter from "gray-matter";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

export interface SeoPost {
  slug: string;
  title: string;
  date?: string | undefined;
  description?: string | undefined;
}

export interface ResolveSiteRootOptions {
  siteUrlOverride: string | undefined;
  owner: string;
  repo: string;
  isUserSite: boolean;
  hasActions: boolean;
  base: string;
}

/** Ensure a site root ends with `/`. */
export function normalizeSiteRoot(root: string): string {
  const trimmed = root.trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

/**
 * Resolve the absolute (or, as a last resort, path-absolute) site root used for
 * `sitemap.xml`, `rss.xml`, canonical URLs and `robots.txt`.
 * - `SITE_URL` env wins when set (include any sub-path, e.g. `https://example.com/blog/`).
 * - Else, under `GITHUB_ACTIONS`, derive the Pages URL from `owner/repo`.
 * - Else, fall back to the build `base` (correct for root-hosted previews;
 *   set `SITE_URL` for canonical sitemaps on custom hosts).
 */
export function resolveSiteRoot({
  siteUrlOverride,
  owner,
  repo,
  isUserSite,
  hasActions,
  base,
}: ResolveSiteRootOptions): string {
  const override = siteUrlOverride?.trim() ?? "";
  if (override !== "") return normalizeSiteRoot(override);
  if (hasActions && owner !== "" && repo !== "") {
    return isUserSite ? `https://${owner}.github.io/` : `https://${owner}.github.io/${repo}/`;
  }
  const withLeading = base.startsWith("/") ? base : `/${base}`;
  return normalizeSiteRoot(withLeading);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Keep `YYYY-MM-DD` (also tolerates full ISO datetimes); drop anything else. */
export function toDateOnly(date: string | undefined): string | undefined {
  if (date === undefined) return undefined;
  return date.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
}

function toRssDate(date: string | undefined): string | undefined {
  const day = toDateOnly(date);
  if (day === undefined) return undefined;
  const time = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(time) ? undefined : new Date(time).toUTCString();
}

export function buildSitemap(posts: readonly SeoPost[], siteRoot: string): string {
  const entries = [
    `  <url>\n    <loc>${escapeXml(siteRoot)}</loc>\n  </url>`,
    ...posts.map((post) => {
      const lastmod = toDateOnly(post.date);
      return (
        `  <url>\n    <loc>${escapeXml(`${siteRoot}post/${post.slug}/`)}</loc>` +
        (lastmod === undefined ? "" : `\n    <lastmod>${lastmod}</lastmod>`) +
        `\n  </url>`
      );
    }),
  ];
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${entries.join("\n")}\n` +
    `</urlset>\n`
  );
}

export interface SiteInfo {
  name: string;
  description: string;
}

export function buildRss(
  posts: readonly SeoPost[],
  siteRoot: string,
  site: SiteInfo,
): string {
  const items = posts
    .map((post) => {
      const link = `${siteRoot}post/${post.slug}/`;
      const pubDate = toRssDate(post.date);
      return (
        `    <item>\n      <title>${escapeXml(post.title)}</title>` +
        `\n      <link>${escapeXml(link)}</link>` +
        `\n      <guid>${escapeXml(link)}</guid>` +
        (post.description === undefined ? "" : `\n      <description>${escapeXml(post.description)}</description>`) +
        (pubDate === undefined ? "" : `\n      <pubDate>${pubDate}</pubDate>`) +
        `\n    </item>`
      );
    })
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n  <channel>\n` +
    `    <title>${escapeXml(site.name)}</title>\n` +
    `    <link>${escapeXml(siteRoot)}</link>\n` +
    `    <description>${escapeXml(site.description)}</description>\n` +
    `${items === "" ? "" : `${items}\n`}` +
    `  </channel>\n</rss>\n`
  );
}

export function buildRobots(siteRoot: string): string {
  const lines = ["User-agent: *", "Allow: /"];
  if (/^https?:\/\//i.test(siteRoot)) lines.push(`Sitemap: ${siteRoot}sitemap.xml`);
  return `${lines.join("\n")}\n`;
}

export interface MdFrontmatterLike {
  title?: unknown;
  date?: unknown;
  description?: unknown;
  draft?: unknown;
}

/**
 * Read `*.md` posts from a content directory (frontmatter via gray-matter).
 * Drafts (`draft: true`) are excluded; sorted date-desc. Used at build time so
 * `sitemap.xml`/`rss.xml` match the production post list.
 */
export function collectPostFiles(contentDir: string): SeoPost[] {
  const files = readdirSync(contentDir).filter((file) => file.endsWith(".md")).sort();
  const posts: SeoPost[] = [];
  for (const file of files) {
    const slug = basename(file).replace(/\.md$/, "");
    const raw = readFileSync(join(contentDir, file), "utf-8");
    const { data } = matter(raw);
    const front = data as MdFrontmatterLike;
    if (front.draft === true) continue;
    const title =
      typeof front.title === "string" && front.title.trim() !== "" ? front.title : slug;
    const post: SeoPost = { slug, title };
    if (typeof front.date === "string") post.date = front.date;
    if (typeof front.description === "string") post.description = front.description;
    posts.push(post);
  }
  return posts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export interface SeoPluginOptions {
  siteRoot: string;
  siteName?: string;
  siteDescription?: string;
  contentDir?: string;
}

/**
 * Build-time SEO: inject canonical / `og:url` / RSS link into `index.html` and
 * emit `sitemap.xml`, `rss.xml` and `robots.txt` via `generateBundle` (so they
 * are real build artifacts, not an out-of-band `cp`).
 */
export function seoPlugin(options: SeoPluginOptions): Plugin {
  const siteName = options.siteName ?? "Svelte Clean Template";
  const siteDescription = options.siteDescription ?? "A clean static Svelte + Tailwind PWA template.";
  const root = normalizeSiteRoot(options.siteRoot);

  return {
    name: "seo",
    transformIndexHtml(html: string) {
      if (!html.includes("</head>")) return html;
      const tags = [
        `<link rel="canonical" href="${root}">`,
        `<meta property="og:url" content="${root}">`,
        `<link rel="alternate" type="application/rss+xml" title="${escapeXml(siteName)}" href="${root}rss.xml">`,
      ].join("\n    ");
      return html.replace("</head>", `    ${tags}\n  </head>`);
    },
    generateBundle() {
      const dir = options.contentDir ?? join(process.cwd(), "src", "content");
      const posts = collectPostFiles(dir);
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: buildSitemap(posts, root) });
      this.emitFile({
        type: "asset",
        fileName: "rss.xml",
        source: buildRss(posts, root, { name: siteName, description: siteDescription }),
      });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: buildRobots(root) });
    },
  };
}
