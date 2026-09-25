import { describe, expect, it } from "bun:test";
import {
  BASE_PLACEHOLDER,
  isExternalUrl,
  mdPlugin,
  rewriteAssetUrls,
  rewriteSrcset,
  rewriteUrl,
} from "../plugins/md.js";

describe("isExternalUrl", () => {
  it.each(["", "#section", "http://example.com/a.png", "https://example.com/a.png", "mailto:a@b.c", "data:image/png;base64,x", "blob:abc"])(
    "treats %p as external",
    (url) => {
      expect(isExternalUrl(url)).toBe(true);
    },
  );

  it.each(["/a.png", "./a.png", "a.png", "content/a.png", "../a.png"])("treats %p as local", (url) => {
    expect(isExternalUrl(url)).toBe(false);
  });
});

describe("rewriteUrl", () => {
  it("base-prefixes root-absolute URLs", () => {
    expect(rewriteUrl("/foo.png", "slug")).toBe(`${BASE_PLACEHOLDER}foo.png`);
  });

  it("maps relative URLs into the slug content folder", () => {
    expect(rewriteUrl("foo.png", "slug")).toBe(`${BASE_PLACEHOLDER}content/slug/foo.png`);
    expect(rewriteUrl("./foo.png", "slug")).toBe(`${BASE_PLACEHOLDER}content/slug/foo.png`);
    expect(rewriteUrl("././foo.png", "slug")).toBe(`${BASE_PLACEHOLDER}content/slug/foo.png`);
    expect(rewriteUrl("../foo.png", "slug")).toBe(`${BASE_PLACEHOLDER}content/slug/foo.png`);
  });

  it("leaves external URLs untouched, including surrounding whitespace", () => {
    expect(rewriteUrl(" https://example.com/a.png ", "slug")).toBe(" https://example.com/a.png ");
    expect(rewriteUrl("#section", "slug")).toBe("#section");
  });
});

describe("rewriteAssetUrls", () => {
  it("rewrites src and href attributes", () => {
    const html = `<img src="/a.png"><a href="./b.png">x</a><p>./b.png</p>`;
    expect(rewriteAssetUrls(html, "slug")).toBe(
      `<img src="${BASE_PLACEHOLDER}a.png"><a href="${BASE_PLACEHOLDER}content/slug/b.png">x</a><p>./b.png</p>`,
    );
  });

  it("handles single-quoted and unquoted attribute values", () => {
    expect(rewriteAssetUrls(`<img src='./a.png'>`, "slug")).toBe(
      `<img src='${BASE_PLACEHOLDER}content/slug/a.png'>`,
    );
    expect(rewriteAssetUrls(`<img src=./a.png>`, "slug")).toBe(
      `<img src=${BASE_PLACEHOLDER}content/slug/a.png>`,
    );
    expect(rewriteAssetUrls(`<a href = "/x.png">y</a>`, "slug")).toBe(
      `<a href = "${BASE_PLACEHOLDER}x.png">y</a>`,
    );
  });

  it("leaves external URLs untouched", () => {
    const html = `<img src="https://example.com/a.png"><a href="#s">x</a>`;
    expect(rewriteAssetUrls(html, "slug")).toBe(html);
  });
});

describe("rewriteSrcset", () => {
  it("rewrites each candidate URL with its descriptor preserved", () => {
    expect(rewriteSrcset("./a.png 480w, /b.png 800w", "slug")).toBe(
      `${BASE_PLACEHOLDER}content/slug/a.png 480w, ${BASE_PLACEHOLDER}b.png 800w`,
    );
  });

  it("leaves data: URLs and external entries untouched", () => {
    const value = "data:image/png;base64,x 1x, https://example.com/b.png 2x";
    expect(rewriteSrcset(value, "slug")).toBe(value);
  });

  it("rewrites srcset attributes in HTML (both quote styles)", () => {
    expect(rewriteAssetUrls(`<img srcset="./a.png 1x, ./b.png 2x">`, "slug")).toBe(
      `<img srcset="${BASE_PLACEHOLDER}content/slug/a.png 1x, ${BASE_PLACEHOLDER}content/slug/b.png 2x">`,
    );
    expect(rewriteAssetUrls(`<img srcset='./a.png 1x'>`, "slug")).toBe(
      `<img srcset='${BASE_PLACEHOLDER}content/slug/a.png 1x'>`,
    );
  });
});

interface TransformResult {
  code: string;
  map: null;
}

describe("mdPlugin transform", () => {
  const warnMessages: string[] = [];
  const ctx = {
    warn(message: string): void {
      warnMessages.push(message);
    },
  };

  function transform(src: string, id: string): TransformResult | null {
    warnMessages.length = 0;
    const plugin = mdPlugin();
    const transformFn = plugin.transform;
    if (typeof transformFn !== "function") throw new Error("md plugin transform is not a function");
    const result = (
      transformFn as (this: typeof ctx, src: string, id: string) => TransformResult | null
    ).call(ctx, src, id);
    return result;
  }

  function metadataFrom(code: string): { title: string; date?: string; description?: string; draft: boolean } {
    const match = code.match(/export const metadata = (.*?);\n/)?.[1];
    if (!match) throw new Error("metadata export not found");
    return JSON.parse(match) as { title: string; date?: string; description?: string; draft: boolean };
  }

  it("ignores non-markdown ids", () => {
    expect(transform("x", "/src/app.ts")).toBeNull();
    expect(transform("x", "/src/app.ts?query=1")).toBeNull();
  });

  it("falls back to the slug with a warning when title is missing", () => {
    const result = transform("---\ndate: 2026-01-01\n---\n# Hi\n", "/content/my-post.md?query=1");
    if (!result) throw new Error("expected transform result");
    expect(metadataFrom(result.code).title).toBe("my-post");
    expect(warnMessages).toHaveLength(1);
  });

  it("keeps only string frontmatter and literal-true drafts", () => {
    const result = transform(
      "---\ntitle: T\ndate: 2026\ndescription: 42\ndraft: yes\n---\nHi\n",
      "/content/x.md",
    );
    if (!result) throw new Error("expected transform result");
    expect(metadataFrom(result.code)).toEqual({ title: "T", draft: false });
    expect(warnMessages).toHaveLength(0);
  });

  it("keeps literal-true drafts and valid string fields", () => {
    const result = transform(
      '---\ntitle: T\ndate: "2026-01-01"\ndescription: D\ndraft: true\n---\nHi\n',
      "/content/x.md",
    );
    if (!result) throw new Error("expected transform result");
    expect(metadataFrom(result.code)).toEqual({
      title: "T",
      date: "2026-01-01",
      description: "D",
      draft: true,
    });
  });

  it("adds heading ids with anchors", () => {
    const result = transform("---\ntitle: T\n---\n# Hello World\n", "/content/x.md");
    if (!result) throw new Error("expected transform result");
    expect(result.code).toContain(`<h1 id=\\"hello-world\\">`);
    expect(result.code).toContain(`href=\\"#hello-world\\"`);
  });

  it("rewrites relative assets into the placeholder that resolves via BASE_URL", () => {
    const result = transform("![alt](./pic.png)\n", "/content/my-post.md");
    if (!result) throw new Error("expected transform result");
    expect(result.code).toContain(`${BASE_PLACEHOLDER}content/my-post/pic.png`);
    expect(result.code).toContain("import.meta.env.BASE_URL");
    expect(result.code).toContain(`replaceAll(${JSON.stringify(BASE_PLACEHOLDER)}, __base)`);
  });
});
