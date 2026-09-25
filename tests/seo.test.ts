import { describe, expect, it } from "bun:test";
import {
  buildRobots,
  buildRss,
  buildSitemap,
  collectPostFiles,
  escapeXml,
  normalizeSiteRoot,
  resolveSiteRoot,
  seoPlugin,
  toDateOnly,
  type SeoPost,
} from "../plugins/seo.js";

const root = "https://owner.github.io/repo/";

describe("normalizeSiteRoot", () => {
  it("ensures a trailing slash", () => {
    expect(normalizeSiteRoot("https://example.com/blog")).toBe("https://example.com/blog/");
    expect(normalizeSiteRoot("https://example.com/blog/")).toBe("https://example.com/blog/");
    expect(normalizeSiteRoot("  /  ")).toBe("/");
  });
});

describe("resolveSiteRoot", () => {
  it("prefers SITE_URL untouched apart from trailing slash", () => {
    expect(
      resolveSiteRoot({
        siteUrlOverride: "https://example.com/blog",
        owner: "owner",
        repo: "repo",
        isUserSite: false,
        hasActions: true,
        base: "/repo/",
      }),
    ).toBe("https://example.com/blog/");
  });

  it("derives the Pages URL on CI", () => {
    expect(
      resolveSiteRoot({
        siteUrlOverride: undefined,
        owner: "owner",
        repo: "repo",
        isUserSite: false,
        hasActions: true,
        base: "/repo/",
      }),
    ).toBe("https://owner.github.io/repo/");
    expect(
      resolveSiteRoot({
        siteUrlOverride: undefined,
        owner: "owner",
        repo: "owner.github.io",
        isUserSite: true,
        hasActions: true,
        base: "/",
      }),
    ).toBe("https://owner.github.io/");
  });

  it("falls back to the build base off CI", () => {
    expect(
      resolveSiteRoot({
        siteUrlOverride: undefined,
        owner: "",
        repo: "",
        isUserSite: false,
        hasActions: false,
        base: "/",
      }),
    ).toBe("/");
  });
});

describe("escapeXml / toDateOnly", () => {
  it("escapes XML entities", () => {
    expect(escapeXml(`a&b<"c">'d'`)).toBe("a&amp;b&lt;&quot;c&quot;&gt;&apos;d&apos;");
  });

  it("keeps ISO dates, tolerates datetimes, drops garbage", () => {
    expect(toDateOnly("2026-09-23")).toBe("2026-09-23");
    expect(toDateOnly("2026-09-23T10:00:00Z")).toBe("2026-09-23");
    expect(toDateOnly("soon")).toBeUndefined();
    expect(toDateOnly(undefined)).toBeUndefined();
  });
});

describe("buildSitemap / buildRss / buildRobots", () => {
  const posts: SeoPost[] = [
    { slug: "second", title: "Second & <post>", date: "2026-09-22", description: "Desc <x>" },
    { slug: "first", title: "First" },
  ];

  it("lists home plus dated posts with valid URLs", () => {
    const sitemap = buildSitemap(posts, root);
    expect(sitemap).toContain(`<loc>${root}</loc>`);
    expect(sitemap).toContain(`<loc>${root}post/second/</loc>`);
    expect(sitemap).toContain("<lastmod>2026-09-22</lastmod>");
    expect(sitemap).toContain(`<loc>${root}post/first/</loc>`);
    expect(sitemap).not.toContain("undefined");
  });

  it("builds a valid RSS feed with escaped fields", () => {
    const rss = buildRss(posts, root, { name: "Site", description: "Desc" });
    expect(rss).toContain(`<link>${root}</link>`);
    expect(rss).toContain(`<link>${root}post/second/</link>`);
    expect(rss).toContain("<title>Second &amp; &lt;post&gt;</title>");
    expect(rss).toContain("<description>Desc &lt;x&gt;</description>");
    expect(rss).toContain(`<pubDate>${new Date(Date.parse("2026-09-22T00:00:00Z")).toUTCString()}</pubDate>`);
  });

  it("keeps the Sitemap line only for absolute roots", () => {
    expect(buildRobots(root)).toContain(`Sitemap: ${root}sitemap.xml`);
    expect(buildRobots("/")).toBe("User-agent: *\nAllow: /\n");
  });
});

describe("collectPostFiles", () => {
  it("sorts date-desc and skips drafts", () => {
    const posts = collectPostFiles(new URL("../src/content", import.meta.url).pathname);
    expect(posts.map((post) => post.slug)).toEqual(["hello", "second-post"]);
    expect(posts[0]?.title).toBe("Hello, markdown");
  });
});

describe("seoPlugin transformIndexHtml", () => {
  it("injects canonical, og:url and RSS links", () => {
    const plugin = seoPlugin({ siteRoot: root });
    const transform = plugin.transformIndexHtml;
    if (typeof transform !== "function") throw new Error("seo plugin transformIndexHtml is not a function");
    const out = (
      transform as (this: unknown, html: string) => string
    ).call({}, "<html><head><title>T</title></head><body></body></html>");
    expect(out).toContain(`<link rel="canonical" href="${root}">`);
    expect(out).toContain(`<meta property="og:url" content="${root}">`);
    expect(out).toContain(`${root}rss.xml`);
  });

  it("leaves non-HTML documents without a head untouched", () => {
    const plugin = seoPlugin({ siteRoot: root });
    const transform = plugin.transformIndexHtml;
    if (typeof transform !== "function") throw new Error("seo plugin transformIndexHtml is not a function");
    expect((transform as (this: unknown, html: string) => string).call({}, "no head")).toBe("no head");
  });
});
