import { describe, expect, it } from "bun:test";
import { normalizeBaseOverride, parseRepo, resolveBase } from "../src/lib/base.js";

describe("parseRepo", () => {
  it("extracts the repo from owner/repo", () => {
    expect(parseRepo("owner/my-repo")).toBe("my-repo");
  });

  it("returns empty string for missing or malformed values", () => {
    expect(parseRepo(undefined)).toBe("");
    expect(parseRepo("")).toBe("");
    expect(parseRepo("owner")).toBe("");
  });
});

describe("resolveBase", () => {
  it("prefers an explicit override untouched", () => {
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: "/custom/", hasActions: true }),
    ).toBe("/custom/");
    expect(resolveBase({ repo: "my-repo", isUserSite: true, baseOverride: "/", hasActions: true })).toBe("/");
  });

  it("derives the Pages sub-path on CI for project sites", () => {
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: undefined, hasActions: true }),
    ).toBe("/my-repo/");
  });

  it("serves user sites and local runs from root", () => {
    expect(
      resolveBase({ repo: "owner.github.io", isUserSite: true, baseOverride: undefined, hasActions: true }),
    ).toBe("/");
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: undefined, hasActions: false }),
    ).toBe("/");
    expect(resolveBase({ repo: "", isUserSite: false, baseOverride: undefined, hasActions: true })).toBe("/");
  });

  it("treats blank overrides as unset", () => {
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: "  ", hasActions: true }),
    ).toBe("/my-repo/");
  });
});

describe("normalizeBaseOverride", () => {
  it("returns undefined for missing or blank values", () => {
    expect(normalizeBaseOverride(undefined)).toBeUndefined();
    expect(normalizeBaseOverride("")).toBeUndefined();
    expect(normalizeBaseOverride("   ")).toBeUndefined();
  });

  it("ensures leading and trailing slashes", () => {
    expect(normalizeBaseOverride("/")).toBe("/");
    expect(normalizeBaseOverride("custom")).toBe("/custom/");
    expect(normalizeBaseOverride("custom/")).toBe("/custom/");
    expect(normalizeBaseOverride("/custom")).toBe("/custom/");
    expect(normalizeBaseOverride(" /custom/ ")).toBe("/custom/");
  });
});
