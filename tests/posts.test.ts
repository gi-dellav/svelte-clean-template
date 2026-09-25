import { describe, expect, it } from "bun:test";
import { buildPosts, compareDateDesc, getPostFrom, type Post } from "../src/lib/post-utils.js";
import type { PostModule } from "../src/md.js";

function makePost(slug: string, date?: string, draft = false): Post {
  return {
    slug,
    metadata: { title: slug, ...(date === undefined ? {} : { date }), draft },
    html: `<p>${slug}</p>`,
  };
}

function makeModule(slug: string, date?: string, draft = false): PostModule {
  const post = makePost(slug, date, draft);
  return { slug: post.slug, metadata: post.metadata, html: post.html, default: post.html };
}

describe("compareDateDesc", () => {
  it("sorts newer dates first", () => {
    const newer = makePost("newer", "2026-02-01");
    const older = makePost("older", "2026-01-01");
    expect(compareDateDesc(newer, older)).toBeLessThan(0);
    expect(compareDateDesc(older, newer)).toBeGreaterThan(0);
    expect(compareDateDesc(newer, newer)).toBe(0);
  });

  it("treats missing dates as empty strings", () => {
    const dated = makePost("dated", "2026-01-01");
    const undated = makePost("undated");
    expect(compareDateDesc(dated, undated)).toBeLessThan(0);
    expect(compareDateDesc(undated, dated)).toBeGreaterThan(0);
  });
});

describe("buildPosts", () => {
  it("sorts date-desc from a glob record", () => {
    const result = buildPosts(
      {
        "./old.md": makeModule("old", "2026-01-01"),
        "./new.md": makeModule("new", "2026-02-01"),
        "./undated.md": makeModule("undated"),
      },
      false,
    );
    expect(result.map((post) => post.slug)).toEqual(["new", "old", "undated"]);
  });

  it("accepts a plain post array", () => {
    const result = buildPosts([makePost("b", "2026-01-01"), makePost("a", "2026-02-01")], false);
    expect(result.map((post) => post.slug)).toEqual(["a", "b"]);
  });

  it("filters drafts only in production", () => {
    const modules = {
      "./live.md": makeModule("live", "2026-01-01"),
      "./draft.md": makeModule("draft", "2026-02-01", true),
    };
    expect(buildPosts(modules, false).map((post) => post.slug)).toEqual(["draft", "live"]);
    expect(buildPosts(modules, true).map((post) => post.slug)).toEqual(["live"]);
  });

  it("maps glob modules to posts without module residue", () => {
    const result = buildPosts({ "./x.md": makeModule("x", "2026-01-01") }, false);
    expect(result).toEqual([makePost("x", "2026-01-01")]);
  });
});

describe("getPostFrom", () => {
  it("finds by slug and returns undefined when missing", () => {
    const list = [makePost("a"), makePost("b")];
    expect(getPostFrom(list, "b")?.slug).toBe("b");
    expect(getPostFrom(list, "missing")).toBeUndefined();
  });
});
